import { DatabaseException } from "@/exceptions/DependencyException";
import { Agent } from "@/external/agents/gitagpt-agent";
import { ChatBot } from "@/interfaces/chatbot.interface";
import { ChatSession } from "@/interfaces/chatsession.interface";
import { Message } from "@/interfaces/message.interface";
import { User } from "@/interfaces/users.interface";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { logger } from "@/utils/logger";
import { Service } from "typedi";

@Service()
export class ChatSessionService {
    public async createChatSession(user: User, name: string = 'Chat Session', chatbotId: string): Promise<ChatSession> {
        const data: ChatSession = { user_id: user._id, name: name, chatbot_id: chatbotId };
        const session = await ChatSessionModel.create(data);
        return session;
    }

    public async getSessionByUUID(uuid: string, userId: string): Promise<ChatSession> {
      return await (ChatSessionModel.findOne({ uuid: uuid, user_id: userId }).populate('chatbot_id').exec());
    }

    public async addMessageToSession(session: ChatSession, message: string, userId: string): Promise<ChatSession> {
        try {
          const dbSession = await ChatSessionModel.findOne(
            { user_id: userId, uuid: session.uuid },
          ).populate('chatbot_id');

          if (!dbSession) {
              logger.error(`Error while adding message to session: ${session._id}`);
              throw new DatabaseException(new Error("Session not found"));
          }

          const userMessage: Message = {
            text: message,
            type: 'text',
            role: MessageRole.USER,
          };

          const gitaAgent = new Agent();
          return await new Promise((resolve, reject) => {
            const userUpdatedChatSession = (chatSession: ChatSession) => {
              resolve(chatSession);
            }
            console.log((dbSession.chatbot_id as ChatBot)?.prompt);
            gitaAgent.sendMessageToAgent(userMessage.text, dbSession, (dbSession.chatbot_id as ChatBot)?.prompt, userUpdatedChatSession);
          });
        } catch (error) {
            const errorMessage = `Error while adding message to session: ${session._id}`;
            logger.error(`${errorMessage} ${error} ${error.stack}`);
            throw new DatabaseException(error);
        }
    }

    public async getMessagesForSession(session: ChatSession): Promise<Message[]> {
        try {
            return session.messages;
        } catch (error) {
            const errorMessage = `Error while getting messages for session: ${session._id}`;
            logger.error(errorMessage);
            throw new DatabaseException(error);
        }
    }
}
