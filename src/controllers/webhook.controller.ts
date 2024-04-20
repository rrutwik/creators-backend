import { User, PaymentStatus } from "@/interfaces/users.interface";
import { PaymentModel } from "@/models/payments.model";
import { NextFunction, Request, Response } from "express";

export class WebHookController {
  public whatsapp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(`whatsapp webhook called`);
      const body = req.body;
      logger.info(`whatsapp webhook body: ${JSON.stringify(body)}`);
      const challenge = req.query["hub.challenge"];
      return res.status(200).send(challenge);
    } catch (error) {
      next(error);
    }
  }
}
