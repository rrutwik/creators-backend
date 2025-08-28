import { NextFunction, Response } from 'express';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/users.service';

const getAuthorization = (req: RequestWithUser) => {
  const cookie = req.cookies['Authorization'];
  if (cookie) return cookie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
}

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const userService = new UserService();
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      // const session = await sessionDBService.getSessionBySessionToken(Authorization);
      // if (session) {
      const { _id } = (verify(Authorization, SECRET_KEY)) as DataStoredInToken;

      const findUser = await userService.getUserFromID(_id);

      if (findUser) {
        req.user = findUser;
        return next();
      } else {
        return next(new HttpException(401, 'Wrong authentication token'));
      }
      // } else {
      //   next(new HttpException(401, 'Wrong authentication token'));
      // }
    } else {
      return next(new HttpException(401, 'Authentication token missing'));
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

