import { Message } from "./message.interface";

export interface ChatSession {
  _id: string,
  user_id: string,
  user?: string,
  messages: Message[],
  is_active: boolean,
  created_at: Date,
  updated_at: Date
};
