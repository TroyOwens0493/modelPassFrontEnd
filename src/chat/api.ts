import { getApiPath } from "../api";
import type { ChatMessage } from "./types";

type CreatedChat = {
    _id: string;
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
