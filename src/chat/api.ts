import { getApiPath } from "../api";
import type { ChatMessage, ChatRole } from "./types";

type CreatedChat = {
    _id: string;
};

export type ChatSummary = {
    _id: string;
    title: string;
};

type ChatResponse = {
    _id: string;
    title: string;
    model: string;
    messages: Array<{
        timestamp: string;
        role: ChatRole;
        text: string;
    }>;
};

export type LoadedChat = Omit<ChatResponse, "messages"> & {
    messages: ChatMessage[];
};

/** Parses a chat API response and throws its server-provided error message. */
async function parseResponse<T>(response: Response) {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.error ?? "The chat request failed");
    }

    return body as T;
}

/** Creates an empty chat for the authenticated user. */
export async function createChat(title: string, model: string) {
    const response = await fetch(getApiPath("/chats"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, model }),
    });

    return parseResponse<CreatedChat>(response);
}

/** Fetches the ids and titles of every chat owned by the authenticated user. */
export async function getChats(userId: string) {
    const response = await fetch(
        getApiPath(`/chats/all/${encodeURIComponent(userId)}`),
        { credentials: "include" },
    );

    return parseResponse<ChatSummary[]>(response);
}

/** Fetches a persisted chat and restores its message timestamps. */
export async function getChat(chatId: string) {
    const response = await fetch(getApiPath(`/chats/${encodeURIComponent(chatId)}`), {
        credentials: "include",
    });
    const chat = await parseResponse<ChatResponse>(response);
    const messages = chat.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
    }));

    if (messages.some((message) => Number.isNaN(message.timestamp.getTime()))) {
        throw new Error("The chat contains an invalid message timestamp");
    }

    return { ...chat, messages } satisfies LoadedChat;
}

/** Appends one completed message to an existing chat. */
export async function appendMessage(chatId: string, message: ChatMessage) {
    const response = await fetch(getApiPath(`/chats/addMessage/${chatId}`), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });

    await parseResponse<unknown>(response);
}
