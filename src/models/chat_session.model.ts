import { model, Schema, Document } from 'mongoose';
import { ChatSession } from '@/interfaces/chatsession.interface';

export enum MessageRole {
    USER = 1,
    ASSISTANT = 2,
    SYSTEM = 3
}

// const MessageSchema: Schema = new Schema({
//     message: {
//         type: String,
//         required: true,
//     },
//     role: {
//         type: MessageRole,
//         required: true,
//     }
// }, { timestamps: true });

const ChatSessionSchema: Schema = new Schema({
    name: {
      type: String,
      default: 'Chat Session',
      required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    uuid: {
        type: String,
        required: true,
        index: true,
        default: () => {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        },
        unique: true
    },
    messages: {
      type: Array,
      required: true,
      default: [],
    }
}, { timestamps: true });

export const ChatSessionModel = model<ChatSession & Document>('chat_session', ChatSessionSchema);
ChatSessionModel.syncIndexes();
