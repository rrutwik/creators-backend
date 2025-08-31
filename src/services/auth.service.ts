import Container, { Service } from 'typedi';
import { compare } from 'bcrypt';

import { HttpException } from '@exceptions/HttpException';
import { Session } from '@/interfaces/session.interface';
import { User } from '@interfaces/users.interface';
import { UserModel } from '@/models/user.model';
import { SessionService } from './session.service';
import { UserProfileModel } from '@/models/user_profile.model';
import { TelegramService } from './telegram.service';
import { logger } from '@/utils/logger';

@Service()
export class AuthService {
  private sessionService = Container.get(SessionService);
  private telegramService = Container.get(TelegramService)
  private otpExpiresTime = 5 * 60 * 1000;

  public async generateQRCodeForLogin(phone: string): Promise<{ success: boolean, error: string, expires_at: number, link: string, token: string }> {
    try {
      const expiresAt = Date.now() + this.otpExpiresTime;
      const { qrCode, token } = await this.telegramService.generateMessageToBotQRCode(phone, expiresAt);
      return { success: true, error: '', expires_at: expiresAt, link: qrCode, token };
    } catch (error) {
      logger.error(`Error generating QR code: ${error}`);
      return { success: false, error: 'Error generating QR code', expires_at: 0, link: '', token: '' };
    }
  }

  public async loginUserWithQRCode(hash: string): Promise<{ user: User, sessionToken: string, refreshToken: string }> {
    // const cachedOTP = await "asdasd";
    // logger.info(`Login user with QR code: ${JSON.stringify(cachedOTP)}`);
    // if (!cachedOTP) throw new HttpException(409, 'OTP not found');
    // let user: User = await UserModel.findOne({ phone: cachedOTP.phone });
    // if (!user) {
    //   user = await this.signupwithphone(cachedOTP.phone);
    // }
    // const userProfile = await UserProfileModel.findOne({ user_id: user._id });
    // const { sessionToken, refreshToken } = await this.login(user);
    // user = {
    //   ...user,
    //   ...userProfile
    // }
    return { user: null, sessionToken: null, refreshToken: null };
  }

  public async signupwithemail(email: string): Promise<User> {
    const findUser: User = await UserModel.findOne({ email });
    if (findUser) throw new HttpException(409, `This email ${email} already exists`);
    const createUserData: User = await UserModel.create({ email });
    await UserProfileModel.create({ user_id: createUserData._id });
    return createUserData;
  }

  public async signupwithphone(phone: string): Promise<User> {
    const findUser: User = await UserModel.findOne({ phone });
    if (findUser) throw new HttpException(409, `This phone ${phone} already exists`);
    const createUserData: User = await UserModel.create({ phone });
    await UserProfileModel.create({ user_id: createUserData._id });
    return createUserData;
  }

  public async login(user: User, checkPassword: boolean = true): Promise<{ sessionToken: string; refreshToken: string; user: User }> {
    const findUser: User = await UserModel.findOne({ email: user.email });
    if (!findUser) throw new HttpException(409, `This email ${user.email} was not found`);
    if (!checkPassword) {
      const isPasswordMatching: boolean = await compare(user.password, findUser.password);
      if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');
    }
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
