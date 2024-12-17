import { NextFunction, Request, Response } from 'express';
import { ChatBotModel } from '@/models/chat_bot.model';
import { ChatBot } from '@/interfaces/chatbot.interface';

export class ChatBotController {
  // Create a new ChatBot
  public createChatBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBotData: ChatBot = req.body;
      const newChatBot = await ChatBotModel.create(chatBotData);
      return res.status(201).json({ data: newChatBot, message: 'ChatBot created' });
    } catch (error) {
      next(error);
    }
  };

  // Get all ChatBots
  public getChatBots = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBots = await ChatBotModel.find({}, {
        _id: 1,
        name: 1
      });
      return res.status(200).json({ records: chatBots, total: chatBots.length, message: 'ChatBots retrieved' });
    } catch (error) {
      next(error);
    }
  };

  // Get a single ChatBot by ID
  public getChatBotById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBotId = req.params.id;
      const chatBot = await ChatBotModel.findById(chatBotId);
      if (!chatBot) {
        return res.status(404).json({ message: 'ChatBot not found' });
      }
      return res.status(200).json({ data: chatBot, message: 'ChatBot retrieved' });
    } catch (error) {
      next(error);
    }
  };

  // Update a ChatBot by ID
  public updateChatBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBotId = req.params.id;
      const chatBotData: ChatBot = req.body;
      const updatedChatBot = await ChatBotModel.findByIdAndUpdate(chatBotId, chatBotData, { new: true });
      if (!updatedChatBot) {
        return res.status(404).json({ message: 'ChatBot not found' });
      }
      return res.status(200).json({ data: updatedChatBot, message: 'ChatBot updated' });
    } catch (error) {
      next(error);
    }
  };

  // Delete a ChatBot by ID
  public deleteChatBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBotId = req.params.id;
      const deletedChatBot = await ChatBotModel.findByIdAndDelete(chatBotId);
      if (!deletedChatBot) {
        return res.status(404).json({ message: 'ChatBot not found' });
      }
      return res.status(200).json({ data: deletedChatBot, message: 'ChatBot deleted' });
    } catch (error) {
      next(error);
    }
  };
}
