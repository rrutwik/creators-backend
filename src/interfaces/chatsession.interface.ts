import { ObjectId } from "mongoose";
import { Message } from "./message.interface";

export interface ChatSession {
  _id: string,
  user_id: string | ObjectId,
  uuid?: string,
  user?: string,
  can_message: boolean,
  messages: Message[],
  is_active: boolean,
  created_at: Date,
  updated_at: Date
};
