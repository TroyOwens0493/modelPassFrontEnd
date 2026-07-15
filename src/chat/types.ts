export type ChatRole = "user" | "model" | "system";

export interface ChatMessage {
    timestamp: Date;
    role: ChatRole;
    text: string;
}

export interface ChatDocument {
    _id?: string;
    userId: string;
    title: string;
    model: string;
    messages: ChatMessage[];
    tokensUsed: number;
    creditsUsed: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateChatBody {
    title: string;
    model: string;
    messages: ChatMessage[];
}
