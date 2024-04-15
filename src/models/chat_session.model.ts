import { model, Schema, Document } from 'mongoose';
import { ChatSession } from '@/interfaces/chatsession.interface';

export enum MessageRole {
    USER = 1,
    ASSISTANT = 2,
    SYSTEM = 3
}

const MessageSchema: Schema = new Schema({
    message: {
        type: String,
        required: true,
    },
    role: {
        type: MessageRole,
        required: true,
    }
}, { timestamps: true });

const ChatSessionSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    messages: [MessageSchema], // This allows for multiple messages per session
}, { timestamps: true });

export const ChatSessionModel = model<ChatSession & Document>('chat_session', ChatSessionSchema);
ChatSessionModel.syncIndexes();
