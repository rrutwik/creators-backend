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

  public async signup(user: User): Promise<User> {
    const findUser: User = await UserModel.findOne({ email: user.email });
    if (findUser) throw new HttpException(409, `This email ${user.email} already exists`);

    const hashedPassword = await hash(user.password, 10);
    const createUserData: User = await UserModel.create({ ...user, password: hashedPassword });
    const userProfile: UserProfile = await UserProfileModel.create({ user_id: createUserData._id });
    return createUserData;
  }

  public async login(user: User, checkPassword: boolean = true): Promise<{ sessionToken: string; refreshToken: string; user: User }> {
    const findUser: User = await UserModel.findOne({ email: user.email });
    if (!findUser) throw new HttpException(409, `This email ${user.email} was not found`);
    if (!checkPassword) {
      const isPasswordMatching: boolean = await compare(user.password, findUser.password);
      if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');
    }
    console.log({
      findUser
    });
    const createdSession: Session = await this.sessionService.createSessionForUser(findUser);
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
