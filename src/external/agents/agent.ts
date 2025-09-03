import { ChatSession } from "@/interfaces/chatsession.interface";
import { logger } from "@/utils/logger";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { OPENAI_KEY, OPENAI_MODEL_NAME, MAXIMUM_CHAT_BUFFER } from "@/config";
import Redis from "ioredis";
import { RedisCache } from "@langchain/community/caches/ioredis";
import { sha256 } from "@langchain/core/utils/hash/sha256";
import { ChatBot } from "@/interfaces/chatbot.interface";
import { throttle } from 'lodash';

const modelName = OPENAI_MODEL_NAME ?? "gpt-3.5-turbo-1106";
const languageMapping = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  ta: "Tamil",
  gu: "Gujarati",
  or: "Oriya",
  pa: "Punjabi"
}
const redisUrl = "redis://127.0.0.1:6379";

const client = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  keyPrefix: "langchain",
  db: 10
});

let cacheClient = null;

function getCacheClient() {
  if (cacheClient) return cacheClient;
  cacheClient = new RedisCache(client);
  cacheClient.makeDefaultKeyEncoder(sha256);
  return cacheClient;
}

console.log({
  OPENAI_MODEL_NAME
})

export class Agent {
  private chatGPTModel = new ChatOpenAI({
    apiKey: OPENAI_KEY,
    temperature: 0,
    model: modelName,
    cache: getCacheClient(),
    callbacks: [{
      handleLLMEnd(output, runId, parentRunId, tags, metadata) {
        logger.debug(`${modelName} response: ${JSON.stringify(output)} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
        if (
          metadata &&
          typeof metadata === "object" &&
          "response" in metadata &&
          metadata.response &&
          typeof (metadata.response as any).headers?.get === "function"
        ) {
          const headers = (metadata.response as any).headers;
          const remainingRequests = headers.get("x-ratelimit-remaining-requests");
          const remainingTokens = headers.get("x-ratelimit-remaining-tokens");
          const resetRequests = headers.get("x-ratelimit-reset-requests");
          const resetTokens = headers.get("x-ratelimit-reset-tokens");

          logger.debug(
            `Rate Limit Info -> Remaining Requests: ${remainingRequests}, Remaining Tokens: ${remainingTokens}, Reset Requests: ${resetRequests}, Reset Tokens: ${resetTokens}`
          );
        }
      },
      handleLLMError(error, runId, parentRunId, tags) {
        logger.error(`${modelName} error: ${error} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
      },
      handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
        logger.debug(`${modelName} start: ${llm} with prompts: ${prompts} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
      },
    }]
  });

  private getMessages(chatSession: ChatSession) {
    const messages = chatSession.messages;
    const history: BaseMessage[] = [];
    const lastFiveMessages = messages.slice(-5);
    lastFiveMessages.forEach((message) => {
      if (message.role === MessageRole.USER) {
        history.push(new HumanMessage(message.text));
      } else if (message.role === MessageRole.ASSISTANT) {
        history.push(new AIMessage(message.text));
      } else if (message.role === MessageRole.SYSTEM) {
        history.push(new SystemMessage(message.text));
      } else {
        throw new Error("Invalid message role");
      }
    });
    return history;
  }

  public async suggestChatSessionNameFromFirstMessage(message: string, bot: ChatBot): Promise<string> {
    const botName = bot.name;
    const religion = bot.religion;
    const botDescription = bot.description;
    const prompt = await ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`You are given a message from a user and a bot name and description and religion of the bot. Suggest a name for this chat session based on the message. Only suggest a name, do not add any additional text.`),
      HumanMessagePromptTemplate.fromTemplate("Message: {message}\nBot Name: {botName}\nBot Religion: {religion}\nBot Description: {botDescription}")
    ]);
    const output = await this.chatGPTModel.invoke(await prompt.format({ message, botName, religion, botDescription }));
    return output.content as string;
  }

  public async sendMessageToAgent(message: string, userLanguage: string, _chatSession: ChatSession, promptString: string, userUpdatedChatSession: (chatSession: ChatSession) => void): Promise<void> {
    const chatSession = await ChatSessionModel.findOneAndUpdate(
      { _id: _chatSession._id },
      {
        can_message: false,
        $push: {
          messages: {
            text: message,
            role: MessageRole.USER
          }
        }
      },
      { new: true }
    );
    userUpdatedChatSession(chatSession);
    try {
      const pastMessages = this.getMessages(_chatSession);
      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(promptString),
        SystemMessagePromptTemplate.fromTemplate(`You are given chat history for reference with new user message. Reply in ${languageMapping[userLanguage]} language while keeping your tone gentle and compassionate.`),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{inputMessage}")
      ]);
      const formattedPrompt = await prompt.format({ history: pastMessages, inputMessage: message });
      logger.debug(`Prompt: ${formattedPrompt}`);
      const readStream = await this.chatGPTModel.stream(formattedPrompt)
      const chatSession = await ChatSessionModel.findOneAndUpdate(
        { _id: _chatSession._id },
        {
          can_message: false,
          $push: {
            messages: {
              text: "",
              role: MessageRole.ASSISTANT
            }
          }
        },
        { new: true }
      );
      const messageId = chatSession.messages[chatSession.messages.length - 1]._id;
      let content = "";

      // Create message updater with database update logic
      const updateMessageInDb = async (newContent: string) => {
        await ChatSessionModel.findOneAndUpdate(
          { _id: _chatSession._id },
          { $set: { "messages.$[message].text": newContent, updatedAt: new Date() } },
          { arrayFilters: [{ "message._id": messageId }] }
        );
      };

      const throttleUpdate = throttle(updateMessageInDb, 500);

      for await (const chunk of readStream) {
        content += chunk.content;
        throttleUpdate(content);
      }

      logger.debug(`Agent response: ${JSON.stringify(content, null, 4)}`);
      const agentMessage = content;
      await ChatSessionModel.findOneAndUpdate(
        { _id: _chatSession._id },
        {
          can_message: true,
          $set: {
            "messages.$[message].text": agentMessage
          }
        },
        {
          arrayFilters: [
            {
              "message._id": messageId
            }
          ]
        }
      );
    } catch (error) {
      // if error is of chatgpt 
      logger.error(`Error while adding message to session: ${_chatSession._id} ${error} ${error.stack}`);
    }
  }
}
