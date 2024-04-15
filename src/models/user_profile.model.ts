import { model, Schema, Document, Model } from 'mongoose';
import { PasswordResetObject, User, UserProfile } from '@interfaces/users.interface';
import { getHashedPassoword } from '@/utils/encrypt';
import { logger } from '@/utils/logger';

const UserProfileSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    default: 10
  }
}, { timestamps: true
});

export const UserProfileModel = model<UserProfile & Document>('user_profile', UserProfileSchema);
UserProfileModel.syncIndexes();
