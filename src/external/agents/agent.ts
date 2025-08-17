import { ChatSession } from "@/interfaces/chatsession.interface";
import { logger } from "@/utils/logger";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { OPENAI_KEY, OPENAI_MODEL_NAME } from "@/config";

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
export class Agent {
  private chatHistory: BaseMessage[] = [];
  private chatGPTModel = new ChatOpenAI({
    apiKey: OPENAI_KEY,
    temperature: 0,
    model: modelName,
    callbacks: [{
      handleLLMEnd(output, runId, parentRunId, tags) {
        logger.debug(`${modelName} response: ${JSON.stringify(output)} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
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

  public async sendMessageToAgent(message: string, userLanguage: string, _chatSession: ChatSession, promptString: string, userUpdatedChatSession: (chatSession: ChatSession) => void): Promise<ChatSession> {
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
    const pastMessages = this.getMessages(_chatSession);
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(promptString),
      SystemMessagePromptTemplate.fromTemplate(`Always reply in ${languageMapping[userLanguage]}, with clarity and natural fluency. If the user switches languages, respond in the new language, while keeping your tone gentle and compassionate.`),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{inputMessage}")
    ]);
    const formattedPrompt = await prompt.format({ history: pastMessages, inputMessage: message });
    logger.info(`Prompt: ${formattedPrompt}`);
    const output = await this.chatGPTModel.invoke(formattedPrompt)
    logger.info(`Agent response: ${JSON.stringify(output, null, 4)}`);
    const agentMessage = output.content;
    return await ChatSessionModel.findOneAndUpdate(
      { _id: _chatSession._id },
      {
        can_message: true,
        $push: {
          messages: {
            text: agentMessage,
            role: MessageRole.ASSISTANT
          }
        }
      },
      { new: true }
    );
  }
}
