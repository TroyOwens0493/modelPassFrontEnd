import { get, writable } from "svelte/store";
import { listChats, type ChatListItem } from "../chat/api";

export type ChatsState = {
    chats: ChatListItem[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
};

const initialState: ChatsState = {
    chats: [],
    loading: false,
    error: null,
    loaded: false,
};

export const chatsStore = writable<ChatsState>(initialState);

let pendingLoad: Promise<ChatListItem[] | null> | null = null;
let requestGeneration = 0;

export function clearChats() {
    requestGeneration += 1;
    pendingLoad = null;
    chatsStore.set(initialState);
}

export async function loadChats(userId: string, force = false) {
    const current = get(chatsStore);

    if (!force && current.loaded) {
        return current.chats;
    }

    if (pendingLoad) {
        const activeLoad = pendingLoad;

        if (!force) {
            return activeLoad;
        }

        await activeLoad;
        return loadChats(userId, true);
    }

    chatsStore.update((state) => ({
        ...state,
        loading: true,
        error: null,
    }));
    const generation = ++requestGeneration;

    pendingLoad = listChats(userId)
        .then((chats) => {
            if (generation !== requestGeneration) {
                return null;
            }

            chatsStore.set({
                chats,
                loading: false,
                error: null,
                loaded: true,
            });
            return chats;
        })
        .catch(() => {
            if (generation !== requestGeneration) {
                return null;
            }

            chatsStore.set({
                chats: [],
                loading: false,
                error: "We could not load your recent chats.",
                loaded: false,
            });
            return null;
        })
        .finally(() => {
            if (generation === requestGeneration) {
                pendingLoad = null;
            }
        });

    return pendingLoad;
}

export function refreshChats(userId: string) {
    return loadChats(userId, true);
}
