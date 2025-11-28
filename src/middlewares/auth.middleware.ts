import { NextFunction, Response } from 'express';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/users.service';
import { SessionDBService } from '@/dbservice/session';

const getAuthorization = (req: RequestWithUser) => {
  const cookie = req.cookies['Authorization'];
  if (cookie) return cookie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
}

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const userService = new UserService();
  const sessionDBService = new SessionDBService();

  try {
    const token = getAuthorization(req);

    if (token) {
      const session = await sessionDBService.getSessionBySessionToken(token);
      if (session) {
        const { _id } = (verify(token, SECRET_KEY)) as DataStoredInToken;

        const findUser = await userService.getUserFromID(_id);

        if (findUser) {
          req.user = findUser;
          return next();
        } else {
          logger.error('User not found for session token: ' + token + ' and user id: ' + _id);
          return next(new HttpException(401, 'Wrong authentication token'));
        }
      } else {
        logger.error('Session not found for session token: ' + token);
        return next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      logger.error('Session token not found');
      return next(new HttpException(401, 'Wrong authentication token'));
    }
  } catch (error) {
    logger.info(`Error in auth middleware: ${error}`);
    logger.error(error);
    if (error instanceof TokenExpiredError) {
      return next(new HttpException(401, 'Token expired'));
    } else {
      logger.error(`Other token verification error: ${error}`);
    }
    return next(new HttpException(401, 'Wrong authentication token'));
  }
};

