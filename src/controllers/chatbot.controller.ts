import { NextFunction, Request, Response } from 'express';
import { ChatBotModel } from '@/models/chat_bot.model';
import { ChatBot } from '@/interfaces/chatbot.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserProfileModel } from '@/models/user_profile.model';
import { UserProfile } from '@/interfaces/users.interface';
import { greetingPerReligionPerLanguage } from '@/data/greeting';
import { Container } from 'typedi';
import { UserService } from '@/services/users.service';
import { cache } from '@/cache';

export class ChatBotController {
  private userService = Container.get(UserService);
  public createChatBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBotData: ChatBot = req.body;
      const newChatBot = await ChatBotModel.create(chatBotData);
      return res.status(201).json({ data: newChatBot, message: 'ChatBot created' });
    } catch (error) {
      next(error);
    }
  };

  private getChatBotsCached = async (): Promise<ChatBot[]> => {
    const key = "chatbots";
    let chatbots = await cache.get<ChatBot[]>(key);
    if (chatbots) return chatbots;
    chatbots = await ChatBotModel.find({}, {
      _id: 1,
      id: 1,
      name: 1,
      description: 1,
      religion: 1,
      avatar: 1,
      greeting: 1,
    });
    cache.set<ChatBot[]>(key, chatbots, 30 * 60 * 1000);
    return chatbots;
  }

  // Get all ChatBots
  public getChatBots = async (_req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = _req.user;
      let [chatBots, userProfile]: [ChatBot[], UserProfile] = await Promise.all([this.getChatBotsCached(), this.userService.getUserProfile(user._id)]);
      const language = userProfile.language || 'en';
      chatBots = chatBots.map((chatBot) => {
        chatBot.greeting = greetingPerReligionPerLanguage[language]?.[chatBot.religion.toLowerCase()] || chatBot.greeting;
        return chatBot;
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

  public getAllChatBotsAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chatBots = await ChatBotModel.find({});
      return res.status(200).json({ records: chatBots, total: chatBots.length, message: 'ChatBots retrieved' });
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
