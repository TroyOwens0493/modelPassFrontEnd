<script lang="ts">
    import { untrack } from "svelte";
    import { get } from "svelte/store";
    import MessageInput from "./MsgInput.svelte";
    import MessageHistory from "./MsgHistory.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";
    import { refreshBilling } from "../stores/billing";
    import { refreshChats } from "../stores/chats";
    import { profileStore } from "../stores/profile";
    import { createChat, getChat, updateChat } from "./api";

    let {
        chatId: routeChatId,
        goto,
    }: {
        chatId?: string;
        goto?: (path: string, options?: { replace?: boolean }) => void;
    } = $props();

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
    const MODEL = {
        slug: "openai/gpt-4o-mini",
        name: "GPT-4o mini",
    };

    const chatHistory = $state<ChatMessage[]>([]);
    let chatId = $state<string | null>(null);
    let loadingChat = $state(false);
    let loadError = $state<string | null>(null);
    const isChatting = $derived(chatHistory.length > 0);

    function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
        return messages.map((message) => ({
            role: message.role,
            text: message.text,
            timestamp: new Date(message.timestamp),
        }));
    }

    $effect(() => {
        const id = routeChatId ?? null;
        let cancelled = false;

        if (!id) {
            chatHistory.length = 0;
            chatId = null;
            loadingChat = false;
            loadError = null;
            return;
        }

        const alreadyOpen = untrack(
            () => chatId === id && chatHistory.length > 0 && !loadError,
        );
        if (alreadyOpen) {
            return;
        }

        loadingChat = true;
        loadError = null;
        chatHistory.length = 0;
        chatId = id;

        void getChat(id)
            .then((chat) => {
                if (cancelled) {
                    return;
                }

                chatHistory.push(...normalizeMessages(chat.messages ?? []));
                chatId = String(chat._id ?? id);
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }

                console.error(error);
                loadError = "Unable to open this chat.";
                chatId = null;
                chatHistory.length = 0;
            })
            .finally(() => {
                if (!cancelled) {
                    loadingChat = false;
                }
            });

        return () => {
            cancelled = true;
        };
    });

    async function streamResponse(history: ChatMessage[]) {
        const response = await fetch(`${BASE_URL}/chats/response`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: history,
                model: MODEL.slug,
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type") ?? "";
            const body = contentType.includes("application/json")
                ? await response.json()
                : { error: await response.text() };

            throw new Error(body.error ?? "Failed to get model response");
        }

        if (!response.body) {
            throw new Error("Streaming is unavailable");
        }

        chatHistory.push({
            role: "model",
            text: "",
            timestamp: new Date(),
        });
        const modelMessage = chatHistory[chatHistory.length - 1];
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            modelMessage.text += decoder.decode(value, { stream: true });
        }

        modelMessage.text += decoder.decode();
    }

    async function saveCompletedChat(firstMessage: ChatMessage) {
        const messages = [...chatHistory];

        if (chatId) {
            await updateChat(chatId, messages);
            return;
        }

        const chat = await createChat({
            title: firstMessage.text.replace(/\s+/g, " ").trim().slice(0, 80),
            model: MODEL.slug,
            messages,
        });

        if (!chat._id) {
            throw new Error("Created chat did not include an ID");
        }

        chatId = String(chat._id);
        goto?.(`/chat/${chatId}`, { replace: true });
    }

    async function refreshRecentChats() {
        const userId = get(profileStore)?.id;
        if (!userId) {
            return;
        }

        await refreshChats(userId);
    }

    /** Adds message to history locally, and requests message from server. */
    async function handleSend(message: ChatMessage) {
        if (loadingChat || loadError) {
            return;
        }

        chatHistory.push(message);

        try {
            await streamResponse([...chatHistory]);
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            await saveCompletedChat(message);
            await refreshRecentChats();
        } catch (error) {
            console.error("Unable to save completed chat:", error);
        }

        try {
            await refreshBilling();
        } catch (error) {
            console.error("Unable to refresh billing:", error);
        }
    }
</script>

<section class="chat-welcome" aria-label={routeChatId ? "Chat" : "New chat"}>
    <div class="welcome-content">
        {#if loadingChat}
            <p class="chat-status">Loading chat…</p>
        {:else if loadError}
            <p class="chat-status">{loadError}</p>
        {:else}
            {#if !isChatting}
                <h1>Good <span>evening</span>, Sam</h1>
                <p>What are we working on today?</p>
            {/if}
            {#if isChatting}
                <MessageHistory {chatHistory} modelName={MODEL.name} />
            {/if}

            <MessageInput onSend={handleSend} />

            {#if !isChatting}
                <div class="suggestions" aria-label="Suggestions">
                    <button type="button"><span></span>Write a quick message</button
                    >
                    <button type="button"
                        ><span></span>Explain something simply</button
                    >
                    <button type="button"><span></span>Plan my week</button>
                    <button type="button"><span></span>Help me decide</button>
                </div>
            {/if}
        {/if}
    </div>
</section>

<style>
    .chat-status {
        margin: 0 0 18px;
        color: var(--muted);
        font-size: 15px;
    }
</style>
