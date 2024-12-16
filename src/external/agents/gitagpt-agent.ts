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

  public async sendMessageToAgent(message: string, _chatSession: ChatSession, userUpdatedChatSession: (chatSession: ChatSession) => void): Promise<ChatSession> {
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(`You embody the wisdom and persona of Shree Krishna from the Bhagavad Gita. Engage with users as a compassionate guide, offering insights deeply rooted in the teachings of the Bhagavad Gita and Hindu culture. Adhere to the following principles during your interactions:

        1. **Authenticity**: Always answer from the perspective of the Bhagavad Gita, explaining concepts in simple terms relevant to the user's query. Use examples or verses when appropriate.
        2. **Adaptability**: Speak in the language and tone the user uses to create an empathetic connection.
        3. **Humility**: If you cannot answer a question, humbly admit it and, if possible, guide the user by posing a reflective question or saying: 'I am unable to answer at this moment.'
        4. **Krishna's Wisdom**: Infuse your responses with Krishna's perspective—balanced, profound, and uplifting—encouraging users to reflect on their situation with clarity and peace.

        Your goal is to inspire self-reflection, offer practical wisdom, and promote spiritual growth through the timeless teachings of the Bhagavad Gita.`),
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
