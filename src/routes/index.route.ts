import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ChatController } from '@/controllers/chat.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { logger } from '@/utils/logger';

export class IndexRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, (req, res) => res.status(200).json({
      status: "Online"
    }));
    this.router.post(`${this.path}error`, (req, res) => {
      const body = req.body;
      const ip =
        (req.headers["cf-connecting-ip"] as string) ||
        req.ip;
      // print url and ip
      const origin = req.get("origin") || req.get("referer") || "unknown";
      const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const requestDetails = {
        ip,
        origin,
        fullUrl,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
      };
      logger.error(`Error API ${JSON.stringify(requestDetails)}`);
      return res.status(200).json({
        status: "Online"
      });
    });
  }
}
