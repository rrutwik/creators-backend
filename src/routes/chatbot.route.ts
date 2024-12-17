import { Router } from 'express';
import { ChatBotController } from '@/controllers/chatbot.controller';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { CreateChatBotDto, UpdateChatBotDto } from '@/dtos/chatbot.dto'; // Define these DTOs as needed.

export class ChatBotRoute implements Routes {
  public path = '/chatbots/';
  public router = Router();
  public chatBotController = new ChatBotController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      ValidationMiddleware(CreateChatBotDto),
      this.chatBotController.createChatBot
    );
    this.router.get(`${this.path}`, this.chatBotController.getChatBots);
    this.router.get(`${this.path}:id`, this.chatBotController.getChatBotById);
    this.router.put(
      `${this.path}:id`,
      ValidationMiddleware(UpdateChatBotDto),
      this.chatBotController.updateChatBot
    );
    this.router.delete(`${this.path}:id`, this.chatBotController.deleteChatBot);
  }
}
