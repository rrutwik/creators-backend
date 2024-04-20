import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { WebHookController } from '@/controllers/webhook.controller';

export class WebHookRoute implements Routes {
  public path = '/webhook/';
  public router = Router();
  public webHookController = new WebHookController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}whatsapp`, this.webHookController.whatsapp);
    this.router.get(`${this.path}whatsapp`, this.webHookController.whatsapp);
  }
}
