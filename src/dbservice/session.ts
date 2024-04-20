import { DatabaseException } from "@/exceptions/DependencyException";
import { Session } from "@/interfaces/session.interface";
import { User } from "@/interfaces/users.interface";
import { ChatSessionModel } from "@/models/chat_session.model";
import { SessionModel } from "@/models/session.model";
import { logger } from "@/utils/logger";
import { Service } from "typedi";

@Service()
export class SessionDBService {
    public async createSessionForUserId(user_id: string, session_token: string, refresh_token: string) {
        const data = { user_id, session_token, refresh_token };
        const session = await SessionModel.create(data);
        return session;
    }

    public async getSessionBySessionToken(sessionToken: string): Promise<Session> {
        try {
            return await SessionModel.findOne({ session_token: sessionToken });
        } catch (error) {
            const errorMessage = `Error while finding user by session token: ${sessionToken}`;
            logger.error(errorMessage);
            throw new DatabaseException(error);
        }
    }

    public async getSessionByRefreshToken(refreshToken: string): Promise<Session> {
      try {
          return await SessionModel.findOne({ refresh_token: refreshToken });
      } catch (error) {
          const errorMessage = `Error while finding user by refresh token: ${refreshToken}`;
          logger.error(errorMessage);
          throw new DatabaseException(error);
      }
    }

    public async deleteAllSessionForUserId(user_id: string): Promise<void> {
        try {
            await SessionModel.deleteMany({ user_id: user_id });
        } catch (error) {
            const errorMessage = `Error while deleting all sessions for user id: ${user_id}`;
            logger.error(errorMessage);
            throw new DatabaseException(error);
        }
    }
}
