import { ChatSession } from "@/interfaces/chatsession.interface";
import { logger } from "@/utils/logger";
import { Service } from "typedi";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { Message } from "@/interfaces/message.interface";


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
  private agentExecutor: AgentExecutor;

  constructor(chatSession: ChatSession) {
    const messages = chatSession.messages;
    messages.forEach((message) => {
      if (message.role === MessageRole.USER) {
        this.chatHistory.push(new HumanMessage(message.message));
      } else if (message.role === MessageRole.ASSISTANT) {
        this.chatHistory.push(new AIMessage(message.message));
      } else if (message.role === MessageRole.SYSTEM) {
        this.chatHistory.push(new SystemMessage(message.message));
      } else {
        throw new Error("Invalid message role");
      }
    });
    logger.info("GitaAgent constructor");
  }

  public async initAgent() {
    const prompt = await pull<ChatPromptTemplate>(
      "hwchase17/structured-chat-agent"
    );
    const tools = [];
    const agent = await createStructuredChatAgent({
      llm: this.chatGPTModel,
      prompt,
      tools
    });
    this.agentExecutor = new AgentExecutor({
      agent,
      tools
    });
  }

  public async sendMessageToAgent(message: Message, chatSession: ChatSession): Promise<ChatSession> {
    await ChatSessionModel.findOneAndUpdate(
      { _id: chatSession._id },
      {
        $push: {
          messages: {
            message: message.message,
            role: MessageRole.USER
          }
        }
      },
      { new: true }
    );
    const output = await this.agentExecutor.invoke({
      input: message.message,
      chat_history: this.chatHistory
    });
    logger.info(`GitaAgent response: ${JSON.stringify(output, null, 4)}`);
    const agentMessage = output.generations[0].text;
    return await ChatSessionModel.findOneAndUpdate(
      { _id: chatSession._id },
      {
        $push: {
          messages: {
            message: agentMessage,
            role: MessageRole.ASSISTANT
          }
        }
      },
      { new: true }
    );
  }
}
