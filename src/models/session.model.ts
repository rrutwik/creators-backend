import { model, Schema, Document } from 'mongoose';
import { Session } from '@interfaces/session.interface';

const SessionSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    session_token: {
        type: String,
        required: true,
        unique: true,
    },
    expiry_time: {
        type: String,
        required: true,
        unique: true,
    },
    refresh_token: {
        type: Date,
        required: true,
        unique: true,
    },
    refresh_token_expiry_time: {
        type: Date,
        required: true,
        unique: true,
    },
});

export const SessionModel = model<Session & Document>('session', SessionSchema);
