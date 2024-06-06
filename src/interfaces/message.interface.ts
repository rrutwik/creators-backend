import { MessageRole } from "@/models/chat_session.model"

export interface Message {
    _id?: string,
    role: MessageRole,
    text: string,
    type: 'text',
    createdAt?: Date
    updatedAt?: Date
}
