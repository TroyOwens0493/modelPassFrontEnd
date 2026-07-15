import { getApiUrl } from "../api";
import type { ChatDocument, ChatMessage, CreateChatBody } from "./types";

export type ChatListItem = {
    _id: string;
    title: string;
    updatedAt?: string;
};

async function chatRequest(path: string, init?: RequestInit) {
    const response = await fetch(getApiUrl(path), {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to save chat");
    }

    return response.json();
}

export function listChats(userId: string) {
    return chatRequest(`/chats/all/${encodeURIComponent(userId)}`) as Promise<
        ChatListItem[]
    >;
}

export function getChat(chatId: string) {
    return chatRequest(`/chats/${encodeURIComponent(chatId)}`) as Promise<ChatDocument>;
}

export function createChat(body: CreateChatBody) {
    return chatRequest("/chats", {
        method: "POST",
        body: JSON.stringify(body),
    }) as Promise<ChatDocument>;
}

export function updateChat(chatId: string, messages: ChatMessage[]) {
    return chatRequest(`/chats/${encodeURIComponent(chatId)}`, {
        method: "PUT",
        body: JSON.stringify({ messages }),
    }) as Promise<ChatDocument>;
}
