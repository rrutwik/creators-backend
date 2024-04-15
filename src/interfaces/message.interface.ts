import { MessageRole } from "@/models/chat_session.model"

export interface Message {
    _id?: string,
    role: MessageRole,
    message: string,
    createdAt?: Date
    updatedAt?: Date
}
