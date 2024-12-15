import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CreateUserDto, UserRefreshTokenDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class AuthRoute implements Routes {
  public path = '/auth/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    console.log("creating auth route");
    this.initializeRoutes();
    console.log("created auth route");
  }

  private initializeRoutes() {
    // this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), this.auth.signUp);
    // this.router.post(`${this.path}login`, ValidationMiddleware(CreateUserDto), this.auth.logIn);
    this.router.post(`${this.path}logout`, AuthMiddleware, this.auth.logOut);
    this.router.get(`${this.path}me`, AuthMiddleware, this.auth.me);
    this.router.post(`${this.path}refresh_token`, ValidationMiddleware(UserRefreshTokenDto), this.auth.refreshToken);
    // google auth
    this.router.post(`${this.path}google_login`, this.auth.googleLogin);
  }
}
