import { DatabaseException } from "@/exceptions/DependencyException";
import { GitaAgent } from "@/external/agents/gitagpt-agent";
import { ChatSession } from "@/interfaces/chatsession.interface";
import { Message } from "@/interfaces/message.interface";
import { User } from "@/interfaces/users.interface";
import { ChatSessionModel, MessageRole } from "@/models/chat_session.model";
import { logger } from "@/utils/logger";
import { Service } from "typedi";

@Service()
export class ChatSessionService {
    public async createChatSession(user: User): Promise<ChatSession> {
        const data = { user_id: user._id };
        const session = await ChatSessionModel.create(data);
        return session;
    }

    public async getSessionById(_id: string, userId: string): Promise<ChatSession> {
      return await ChatSessionModel.findOne({ _id: _id, user_id: userId });
    }

    public async addMessageToSession(session: ChatSession, message: string, userId: string): Promise<ChatSession> {
        try {
          const dbSession = await ChatSessionModel.findOne(
            { user_id: userId, session_id: session._id },
          );
          if (!dbSession) {
              logger.error(`Error while adding message to session: ${session._id}`);
              throw new DatabaseException(new Error("Session not found"));
          }
          const newMessage = dbSession.messages[dbSession.messages.length - 1];
          const userMessage: Message = {
            message,
            role: MessageRole.USER,
          };
          const gitaAgent = new GitaAgent(dbSession);
          await gitaAgent.initAgent();
          gitaAgent.sendMessageToAgent(userMessage, dbSession);
          return dbSession;
        } catch (error) {
            const errorMessage = `Error while adding message to session: ${session._id}`;
            logger.error(errorMessage);
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
