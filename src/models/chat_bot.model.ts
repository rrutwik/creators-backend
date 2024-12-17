import { model, Schema, Document, Types } from 'mongoose';
import { ChatBot } from '@/interfaces/chatbot.interface';

const ChatBotSchema: Schema = new Schema({
    name: {
      type: String,
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
}, { timestamps: true });

export const ChatBotModel = model<ChatBot & Document>('chatbot', ChatBotSchema);
ChatBotModel.syncIndexes();
