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
  email: {
    type: String,
    required: true,
    sparse: true,
    nullable: true,
    unique: true,
    default: null
  },
  phone: {
    type: String,
    required: true,
    sparse: true,
    unique: true,
    nullable: true,
    default: null
  },
  password: {
    type: String,
    required: false,
    default: null
  },
  password_reset_object: {
    type: PasswordResetObjectSchema,
    default: null,
  },
}, {
  timestamps: true
});

// Add a pre-save hook to ensure at least one of email or phone is provided
UserSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone must be provided');
  }
  next();
});

UserSchema.index({ email: 1, phone: 1 }, { unique: true, partialFilterExpression: { 
  $or: [
    { email: { $exists: true } },
    { phone: { $exists: true } }
  ]
}});

export const UserModel = model<User & Document>('user', UserSchema);
UserModel.syncIndexes();

UserModel.updateMany(
  { 
    $or: [
      { email: { $exists: false } },
      { phone: { $exists: false } }
    ]
  },
  [
    {
      $set: {
        email: { $ifNull: ["$email", null] },
        phone: { $ifNull: ["$phone", null] }
      }
    }
  ]
);
