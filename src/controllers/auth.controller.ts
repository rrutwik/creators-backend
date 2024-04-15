import { NextFunction, Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';
import { GoogleLoginBody, GoogleLoginRequest, RefreshTokenRequest, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { getGoogleUserInfo, oauth2Client, scopes } from '@/external/googleapis';
import { UserService } from '@/services/users.service';

export class AuthController {
  public authService = Container.get(AuthService);
  public userService = Container.get(UserService);

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: User = req.body;
      const signUpUserData: User = await this.authService.signup(userData);
      return res.status(201).json({ data: signUpUserData, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: User = req.body;
      const { user } = await this.authService.login(userData);
      return res.status(200).json({ data: user, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: RefreshTokenRequest, res: Response, next: NextFunction) => {
    try {
      const {refreshToken} = req.body;
      const { sessionToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
      return res.status(200).json({ data: {
        sessionToken,
        refreshToken: newRefreshToken
      }, message: 'login' });
    } catch (error) {
      next(error);
    }
  }

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userData: User = req.user;
      await this.authService.logout(userData);
      return res.status(200).json({ data: {
        sessionToken: null,
        refreshToken: null
      }, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userData: User = req.user;
      return res.status(200).json({ data: userData, message: 'user_info' });
    } catch (error) {
      next(error);
    }
  };

  public googleLogin = async (req: GoogleLoginRequest, res: Response, next: NextFunction) => {
    try {
      const body: GoogleLoginBody = req.body;
      const googleUser = await getGoogleUserInfo(body);
      const email = googleUser.email;

      // Check if user exists
      let user = await this.userService.findUserByEmail(email);
      if (!user) {
        // If user doesn't exist, create a new one
        user = await this.userService.createUserFromGoogle(googleUser);
      }
      const {sessionToken, refreshToken, user: loggedInUser } = await this.authService.login(user);
      return res.status(200).json({ data: { user: loggedInUser, sessionToken, refreshToken }, message: 'login' });
    } catch (error) {
      next(error);
    }
  }

}
