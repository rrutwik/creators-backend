import { model, Schema, Document, Model } from 'mongoose';
import { PasswordResetObject, User } from '@interfaces/users.interface';
import { getHashedPassoword } from '@/utils/encrypt';
import { logger } from '@/utils/logger';

interface PasswordResetObjectDocument extends PasswordResetObject, Document {}

const PasswordResetObjectSchema: Schema<PasswordResetObjectDocument> = new Schema<PasswordResetObjectDocument>({
  reset_token: {
    type: String,
    index: true,
    required: true,
  },
  reset_token_expiry: {
    type: Date,
    required: true,
  },
});

const UserSchema: Schema = new Schema({
  mobile: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    default: () => {
      const password = Math.random().toString(36).slice(-8);
      logger.info(`Default password ${password}`);
      return getHashedPassoword(password);
    }
  },
  password_reset_object: {
    type: PasswordResetObjectSchema,
    default: null,
  },
});

export const UserModel = model<User & Document>('User', UserSchema);
UserModel.syncIndexes();
