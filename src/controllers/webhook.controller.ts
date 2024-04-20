import { User, PaymentStatus } from "@/interfaces/users.interface";
import { PaymentModel } from "@/models/payments.model";
import { NextFunction, Request, Response } from "express";

export class WebHookController {
  public whatsapp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body, req.query, req.params, req.headers);
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      next(error);
    }
  }
}
