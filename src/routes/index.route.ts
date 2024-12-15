import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ChatController } from '@/controllers/chat.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';

export class IndexRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, (req, res) => res.status(200).json({
      status: "Online"
    }));
  }
}
