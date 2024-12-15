import { Request } from 'express';
import { User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  _id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}

export interface HandleMessageRequest extends RequestWithUser {
  body: {
      message: string,
      file_id?: string,
      chat_id: string
  }
}

export interface RefreshTokenRequest extends Request {
  body: {
    refreshToken: string;
  }
}

export interface GoogleLoginBody {
  client_id: string;
  credential: string;
  select_by: string;
}

export interface GoogleLoginRequest extends Request {
  body: GoogleLoginBody
}
