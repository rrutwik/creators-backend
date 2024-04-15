import { NextFunction, Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';
import { GoogleLoginBody, GoogleLoginRequest, HandleMessageRequest, RefreshTokenRequest, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { getGoogleUserInfo, oauth2Client, scopes } from '@/external/googleapis';
import { UserService } from '@/services/users.service';
import { ChatSessionService } from '@/services/chatsession.service';
import { logger } from '@/utils/logger';

export class ChatController {
  public authService = Container.get(AuthService);
  public userService = Container.get(UserService);
  public chatSessionService = Container.get(ChatSessionService);

  public handleMessageOfUser = async (req: HandleMessageRequest, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      const sessionId = req.body.session_id;
      const message = req.body.message;
      let chatSession = null;
      if (sessionId) {
        chatSession = await this.chatSessionService.getSessionById(sessionId, user._id);
      } else {  
        chatSession = await this.chatSessionService.createChatSession(user);
      }
      if (!chatSession) {
        logger.error(`error: chat session not found`);
        return res.status(404).json({ message: 'session not found' });
      }
      await this.chatSessionService.addMessageToSession(chatSession, message, user._id);
      return res.status(200).json({ message: `message added to session ${chatSession._id}` });
    } catch (error) {
      logger.error(`error: ${error} errorstack: ${error.stack} error message: ${error.message}`);
      next(error);
    }
  };

  public getMessagesOfSession = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      const sessionId = req.params.sessionId;
      const chatSession = await this.chatSessionService.getSessionById(sessionId, user._id);
      if (!chatSession) {
        logger.error(`error: chat session not found`);
        return res.status(404).json({ message: 'session not found' });
      }
      const messages = await this.chatSessionService.getMessagesForSession(chatSession);
      return res.status(200).json({ messages, session_id: chatSession._id });
    } catch (error) {
      logger.error(`error: ${error} errorstack: ${error.stack} error message: ${error.message}`);
      next(error);
    }
  }
}
