import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@/middlewares/auth.middleware';

export class UserRoute implements Routes {
  public path = '/user/';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}create_razorpay_order`, AuthMiddleware, this.user.createRazorpayOrder);
    this.router.get(`${this.path}chats/history`, AuthMiddleware, this.user.getChatHistory);
    this.router.get(`${this.path}chats`, AuthMiddleware, this.user.getChats);
    this.router.get(`${this.path}chat/:id`, AuthMiddleware, this.user.getChat);
    this.router.post(`${this.path}chats/send_message`, AuthMiddleware, this.user.sendMessage);
    this.router.post(`${this.path}profile`, AuthMiddleware, this.user.getProfile);
  }
}
