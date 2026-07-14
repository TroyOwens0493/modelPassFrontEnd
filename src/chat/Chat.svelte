<script lang="ts">
    import MessageInput from "./MsgInput.svelte";
    import MessageHistory from "./MsgHistory.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

    const chatHistory = $state<ChatMessage[]>([]);
    const isChatting = $derived(chatHistory.length > 0);

    async function streamResponse(history: ChatMessage[]) {
        const response = await fetch(`${BASE_URL}/chats/response`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: history,
                model: "openai/gpt-4o-mini",
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

    /** Adds message to history locally, and requests message from server. */
    async function handleSend(message: ChatMessage) {
        chatHistory.push(message);
        try {
            await streamResponse([...chatHistory]);
        } catch (error) {
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
    </div>
</section>
