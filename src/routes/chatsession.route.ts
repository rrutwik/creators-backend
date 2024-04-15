import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CreateUserDto, UserRefreshTokenDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { ChatController } from '@/controllers/chat.controller';

export class AuthRoute implements Routes {
  public path = '/chat/';
  public router = Router();
  public chatController = new ChatController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}message`, AuthMiddleware, this.chatController.handleMessageOfUser);
    this.router.get(`${this.path}messages/:sessionId`, AuthMiddleware, this.chatController.getMessagesOfSession);
  }
}
