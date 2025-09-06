import { NextFunction, Request, Response, Router } from 'express';
import { ChatBotController } from '@/controllers/chatbot.controller';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { CreateChatBotDto, UpdateChatBotDto } from '@/dtos/chatbot.dto'; // Define these DTOs as needed.
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { RequestWithUser } from '@/interfaces/auth.interface';

const AdminMiddleware = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || user.email !== "rutwik2808@gmail.com") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export class AdminRoute implements Routes {
  public path = '/admin/';
  public router = Router();
  public chatBotController = new ChatBotController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
        `${this.path}chatbot`,
        ValidationMiddleware(CreateChatBotDto),
        this.chatBotController.createChatBot
      );
    this.router.get(`${this.path}chatbot`, AuthMiddleware, AdminMiddleware, this.chatBotController.getAllChatBotsAdmin);
    this.router.get(`${this.path}chatbot/:id`, AuthMiddleware, AdminMiddleware, this.chatBotController.getChatBotById);
    this.router.put(`${this.path}chatbot/:id`, AuthMiddleware, AdminMiddleware, ValidationMiddleware(UpdateChatBotDto), this.chatBotController.updateChatBot);
  }
}
