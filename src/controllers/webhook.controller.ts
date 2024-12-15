import { logger } from "@/utils/logger";
import { NextFunction, Request, Response } from "express";

export class WebHookController {
  private sendMessage = async (message: string, phoneNumber: string) => {
    try {
        const accessToken = 'EAAUl6xNZAaf0BOziTRAFqJKC8UqusLpw0dWLMFjfE22gAjnv6ZAVBA1cDZCgk7gZB4kZCXHqspg7wjlcKJC4DU3thccVQfEEg9meZB9d1EwMGt6AvVlfxbKB2mNcC1Ft8VZAyEuIL6zzFo03mbxsgWT7cLEmHBEcrVrBkO8MSNzKVbnHQ0DS3IAaAXsbOCazDPmGsutCqbqMcl4ofRxvOg90EQHTaY0ZCu3hewjR'; // Replace with your Facebook access token
        const apiUrl = 'https://graph.facebook.com/v19.0/292764753913904/messages';

          const requestData = {
              messaging_product: 'whatsapp',
              to: phoneNumber,
              type: 'template',
              template: {
                  name: 'hello_world',
                  language: {
                      code: 'en_US'
                  }
              }
          };

          const response = await axios.post(apiUrl, requestData, {
              headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
              }
          });

          console.log('Message sent successfully:', response.data);
      } catch (error) {
          console.error('Error sending message:', error.response.data);
      }
  }
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
