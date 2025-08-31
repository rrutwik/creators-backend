import Container, { Service } from 'typedi';
import { compare, hash } from 'bcrypt';

import { HttpException } from '@exceptions/HttpException';
import { Session } from '@/interfaces/session.interface';
import { User, UserProfile } from '@interfaces/users.interface';
import { UserModel } from '@/models/user.model';
import { SessionService } from './session.service';
import { UserProfileModel } from '@/models/user_profile.model';

@Service()
export class AuthService {
  public sessionService = Container.get(SessionService);

  public async signupwithemail(email: string): Promise<User> {
    const findUser: User = await UserModel.findOne({ email });
    if (findUser) throw new HttpException(409, `This email ${email} already exists`);
    const createUserData: User = await UserModel.create({ email });
    await UserProfileModel.create({ user_id: createUserData._id });
    return createUserData;
  }

  public async login(user: User): Promise<{ sessionToken: string; refreshToken: string; user: User }> {
    const findUser: User = await UserModel.findOne({ email: user.email });
    if (!findUser) throw new HttpException(409, `This email ${user.email} was not found`);
    const createdSession: Session = await this.sessionService.createSessionForUserId({ _id: findUser._id });
    return { sessionToken: createdSession.session_token, refreshToken: createdSession.refresh_token, user: findUser };
  }

  public async refreshToken(refreshToken: string): Promise<{ sessionToken: string, refreshToken: string }> {
    const newSession = await this.sessionService.refreshSessionForUser(refreshToken);
    return { sessionToken: newSession.session_token, refreshToken: newSession.refresh_token };
  }

  public async logout(user: User): Promise<void> {
    await this.sessionService.deleteAllSessionsOfUser(user);
  }
}
