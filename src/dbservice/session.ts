import { DatabaseException } from "@/exceptions/DependencyException";
import { Session } from "@/interfaces/session.interface";
import { User } from "@/interfaces/users.interface";
import { SessionModel } from "@/models/session.model";
import { logger } from "@/utils/logger";

export class SessionDBService {
    public async createSessionForUserId(user_id: string, session_token: string,, refresh_token: string, expiry_time: Date, refresh_token_expiry_time: Date) {
        const data = { user_id, session_token, expiry_time, refresh_token, refresh_token_expiry_time };
        const session = await SessionModel.create(data);
        return session;
    }

    public async getSessionBySessionToken(session_token: string): Promise<Session> {
        try {
            return await SessionModel.findOne({ session_token: session_token });
        } catch (error) {
            const errorMessage = `Error while finding user by session token: ${session_token}`;
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