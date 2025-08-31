import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { UserRefreshTokenDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { SendOTPDto } from '@/dtos/auth.dto';

export class AuthRoute implements Routes {
  public path = '/auth/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), this.auth.signUp);
    // this.router.post(`${this.path}login`, ValidationMiddleware(CreateUserDto), this.auth.logIn);
    this.router.post(`${this.path}generate_qr_code`, ValidationMiddleware(SendOTPDto), this.auth.generateQRCodeForLogin);
    this.router.post(`${this.path}logout`, AuthMiddleware, this.auth.logOut);
    this.router.get(`${this.path}me`, AuthMiddleware, this.auth.me);
    this.router.post(`${this.path}refresh_token`, ValidationMiddleware(UserRefreshTokenDto), this.auth.refreshToken);
    // google auth
    this.router.post(`${this.path}google_login`, this.auth.googleLogin);
    this.router.post(`${this.path}telegram-webhook`, this.auth.telegramWebhook);
  }
}
