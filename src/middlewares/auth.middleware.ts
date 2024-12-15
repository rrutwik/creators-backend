import { NextFunction, Response } from 'express';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { UserModel } from '@/models/user.model';
import { SessionDBService } from '@/dbservice/session';
import { logger } from '@/utils/logger';

const getAuthorization = (req: RequestWithUser) => {
  const cookie = req.cookies['Authorization'];
  if (cookie) return cookie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
}

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const sessionDBService = new SessionDBService();
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const session = await sessionDBService.getSessionBySessionToken(Authorization);
      if (session) {
        const { _id } = (verify(Authorization, SECRET_KEY)) as DataStoredInToken;
        const findUser = await UserModel.findById(_id);

        if (findUser) {
          req.user = findUser;
          next();
        } else {
          next(new HttpException(401, 'Wrong authentication token'));
        }
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(401, 'Authentication token missing'));
    }
  } catch (error) {
    logger.info(`Error in auth middleware: ${error}`);
    logger.error(error);
    if (error instanceof TokenExpiredError) {
      next(new HttpException(401, 'Token expired'));
    } else {
      console.log('Other token verification error:', error.message);
    }
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

