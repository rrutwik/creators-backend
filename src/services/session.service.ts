import Container, { Service } from 'typedi';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { compare, hash } from 'bcrypt';

import { HttpException } from '@exceptions/HttpException';
import { SECRET_KEY } from '@config';
import { Session } from '@/interfaces/session.interface';
import { SessionDBService } from '@/dbservice/session';
import { User } from '@interfaces/users.interface';
import { UserModel } from '@/models/user.model';
import moment from 'moment-timezone';
import { randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';


@Service()
export class SessionService {
  private sessionDBService = Container.get(SessionDBService);
  private sessionExpiryHours = 3;
  private refreshTokenExpiryDays = 24;

  public async createSessionForUser(user: User): Promise<Session> {
    await this.sessionDBService.deleteAllSessionForUserId(user._id);
    const jsonBody = { _id: user._id };

    const sessionToken = sign(jsonBody, SECRET_KEY, { expiresIn: `${this.sessionExpiryHours}h` });
    const refreshToken = sign(jsonBody, SECRET_KEY, { expiresIn: `${this.refreshTokenExpiryDays}d` });
    const session = await this.sessionDBService.createSessionForUserId(user._id, sessionToken, refreshToken);
    return session;
  }

  public async refreshSessionForUser(refreshToken: string): Promise<Session> {
    const session = await this.sessionDBService.getSessionBySessionToken(refreshToken);
    if (moment().isAfter(moment(session.refresh_token_expiry_time))) {
      const user = await UserModel.findById(session.user_id);
      const newSession: Session = await this.createSessionForUser(user);
      return newSession;
    } else {
      throw new HttpException(401, 'Refresh token expired');
    }
  }

  public async deleteAllSessionsOfUser(userData: User): Promise<void> {
    await this.sessionDBService.deleteAllSessionForUserId(userData._id);
  }
}
