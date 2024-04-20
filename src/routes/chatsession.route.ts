import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ChatController } from '@/controllers/chat.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';

export class AuthRoute implements Routes {
  public path = '/auth/';
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
