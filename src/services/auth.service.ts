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

const createCookie = (tokenData: TokenData): string => {
  return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
};

@Service()
export class AuthService {
  public sessionDBService = Container.get(SessionDBService);
  private sessionExpiryHours = 3;
  private refreshTokenExpiryDays = 24;

  private async loginUser(user: User): Promise<Session> {
    await this.sessionDBService.deleteAllSessionForUserId(user._id);
    const sessionToken = randomUUID();
    const refreshToken = randomUUID();
    const expiryTime = moment().add(this.sessionExpiryHours, 'hour').toDate();
    const refreshTokenExpiryTime = moment().add(this.refreshTokenExpiryDays, 'day').toDate();
    const session = await this.sessionDBService.createSessionForUserId(user._id, sessionToken, refreshToken, expiryTime, refreshTokenExpiryTime);
    return session;
  }

  public async signup(userData: User): Promise<User> {
    const findUser: User = await UserModel.findOne({ email: userData.email });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = await UserModel.create({ ...userData, password: hashedPassword });

    return createUserData;
  }

  public async login(userData: User): Promise<{ sessionToken: string; refreshToken: string; findUser: User }> {
    const findUser: User = await UserModel.findOne({ email: userData.email });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);
    const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');
    const session: Session = await this.loginUser(findUser);
    return { sessionToken: session.session_token, refreshToken: session.refresh_token, findUser };
  }

  public async refreshToken(user: User, session: Session): Promise<{ sessionToken: string, refreshToken: string }> {
    if (session.user_id != user._id) throw new HttpException(409, 'Invalid session token');
    if (moment().isAfter(moment(session.refresh_token_expiry_time))) throw new HttpException(409, 'Refresh token expired');
    const newSession: Session = await this.loginUser(user);
    return { sessionToken: session.session_token, refreshToken: session.refresh_token };
  }

  public async logout(userData: User): Promise<void> {
    await this.sessionDBService.deleteAllSessionForUserId(userData._id);
  }
}
