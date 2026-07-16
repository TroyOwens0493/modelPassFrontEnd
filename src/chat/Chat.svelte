<script lang="ts">
    import MessageInput from "./MsgInput.svelte";
    import MessageHistory from "./MsgHistory.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";
    import { refreshBilling } from "../stores/billing";
    import { getAvailableModels } from "./modelOptions";

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
    const availableModels = getAvailableModels();
    import { authenticatedFetch } from "../api";

    const chatHistory = $state<ChatMessage[]>([]);
    const isChatting = $derived(chatHistory.length > 0);
    let flashMessage = $state("");
    let selectedModel = $state(availableModels[0]?.slug ?? "openai/gpt-4o-mini");
    let authenticationRequired = $state(false);

    function isInsufficientCreditsError(error: unknown) {
        return (
            error instanceof Error &&
            "code" in error &&
            error.code === "INSUFFICIENT_CREDITS"
        );
    }

    async function streamResponse(history: ChatMessage[]) {
        const response = await authenticatedFetch("/chats/response", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: history,
                model: selectedModel,
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type") ?? "";
            const body = contentType.includes("application/json")
                ? await response.json()
                : { error: await response.text() };

            const error = new Error(body.error ?? "Failed to get model response");
            Object.assign(error, { code: body.code, status: response.status });
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
    }

    /** Adds message to history locally, and requests message from server. */
    async function handleSend(message: ChatMessage) {
        flashMessage = "";
        authenticationRequired = false;
        chatHistory.push(message);
        try {
            await streamResponse([...chatHistory]);
            await refreshBilling();
        } catch (error) {
            if (isInsufficientCreditsError(error)) {
                flashMessage = "You don't have enough credits. Add credits to continue.";
                return;
            }

            if (error instanceof Error && "status" in error && error.status === 401) {
                authenticationRequired = true;
                flashMessage = "Your session ended. Sign in to continue chatting.";
                return;
            }

            console.error(error);
        }
    }
</script>

<section class="chat-welcome" aria-label="New chat">
    <div class="welcome-content">
        {#if !isChatting}
            <h1>Good <span>evening</span>, Sam</h1>
            <p>What are we working on today?</p>
        {/if}
        {#if isChatting}
            <MessageHistory {chatHistory} />
        {/if}

        <MessageInput onSend={handleSend} bind:selectedModel={selectedModel} models={availableModels} />

        {#if flashMessage}
            <p class="chat-flash" role="alert">{flashMessage}</p>
        {/if}

        {#if authenticationRequired}
            <a href="/login">Sign in</a>
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
