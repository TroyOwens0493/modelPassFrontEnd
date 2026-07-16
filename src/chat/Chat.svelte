<script lang="ts">
    import MessageInput from "./MsgInput.svelte";
    import MessageHistory from "./MsgHistory.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";
    import { refreshBilling } from "../stores/billing";
    import { getApiPath } from "../api";
    import { appendMessage, createChat } from "./api";
    import { getDisplayName, profileStore } from "../stores/profile";

    const model = "openai/gpt-4o-mini";
    const chatHistory = $state<ChatMessage[]>([]);
    const isChatting = $derived(chatHistory.length > 0);
    const name = $derived(getDisplayName($profileStore));
    let flashMessage = $state("");
    let chatId = $state<string | null>(null);
    let isSending = $state(false);

    /** Identifies the API error returned when a user cannot afford a response. */
    function isInsufficientCreditsError(error: unknown) {
        return (
            error instanceof Error &&
            "code" in error &&
            error.code === "INSUFFICIENT_CREDITS"
        );
    }

    /** Streams a model response into local history and returns it when complete. */
    async function streamResponse(history: ChatMessage[]) {
        const response = await fetch(getApiPath("/chats/response"), {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: history,
                model,
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type") ?? "";
            const body = contentType.includes("application/json")
                ? await response.json()
                : { error: await response.text() };

            const error = new Error(
                body.error ?? "Failed to get model response",
            );
            Object.assign(error, { code: body.code });
            throw error;
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
        return modelMessage;
    }

    /** Requests a response, then persists the completed user/model turn. */
    async function handleSend(message: ChatMessage) {
        if (isSending) return;

        flashMessage = "";
        isSending = true;
        chatHistory.push(message);

        try {
            const modelMessage = await streamResponse([...chatHistory]);

            if (!chatId) {
                const chat = await createChat(message.text.slice(0, 60), model);
                chatId = chat._id;
            }

            await appendMessage(chatId, message);
            await appendMessage(chatId, modelMessage);
            await refreshBilling();
        } catch (error) {
            if (isInsufficientCreditsError(error)) {
                flashMessage =
                    "You don't have enough credits. Add credits to continue.";
                return;
            }

            console.error(error);
            flashMessage = "Something went wrong. Please try again.";
        } finally {
            isSending = false;
        }
    }
</script>

<section class="chat-welcome" aria-label="New chat">
    <div class="welcome-content">
        {#if !isChatting}
            <h1>Good <span>evening</span>, {name}</h1>
            <p>What are we working on today?</p>
        {/if}
        {#if isChatting}
            <MessageHistory {chatHistory} />
        {/if}

        <MessageInput onSend={handleSend} disabled={isSending} />

        {#if flashMessage}
            <p class="chat-flash" role="alert">{flashMessage}</p>
        {/if}

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
    </div>
</section>
