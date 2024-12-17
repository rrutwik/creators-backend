import { ChatSession } from "@/interfaces/chatsession.interface";
import { logger } from "@/utils/logger";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

export class GitaAgent {
  private chatHistory: BaseMessage[] = [];
  private chatGPTModel = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0,
    callbacks: [{
      handleLLMEnd(output, runId, parentRunId, tags) {
        logger.debug(`GPT-3.5 Turbo response: ${JSON.stringify(output)} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
      },
      handleLLMError(error, runId, parentRunId, tags) {
        logger.error(`GPT-3.5 Turbo error: ${error} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
      },
      handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
        logger.debug(`GPT-3.5 Turbo start: ${llm} with prompts: ${prompts} for runId: ${runId} with tags: ${tags} and parentRunId: ${parentRunId}`);
      },
    }]
  });

  private getMessages(chatSession: ChatSession) {
    const messages = chatSession.messages;
    messages.forEach((message) => {
      if (message.role === MessageRole.USER) {
        this.chatHistory.push(new HumanMessage(message.text));
      } else if (message.role === MessageRole.ASSISTANT) {
        this.chatHistory.push(new AIMessage(message.text));
      } else if (message.role === MessageRole.SYSTEM) {
        this.chatHistory.push(new SystemMessage(message.text));
      } else {
        throw new Error("Invalid message role");
      }
    });
    return this.chatHistory;
  }

  public async sendMessageToAgent(message: string, _chatSession: ChatSession, promptString: string, userUpdatedChatSession: (chatSession: ChatSession) => void): Promise<ChatSession> {
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(promptString),
      new MessagesPlaceholder("messages")
  ]);

    const chain = prompt.pipe(this.chatGPTModel);
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
    const output = await chain.invoke({
      messages: this.getMessages(chatSession)
    })
    logger.info(`GitaAgent response: ${JSON.stringify(output, null, 4)}`);
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
