<script lang="ts">
    import { onMount } from "svelte";
    import MessageInput from "./MsgInput.svelte";
    import MessageHistory from "./MsgHistory.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";
    import { refreshBilling } from "../stores/billing";
    import { getApiPath } from "../api";
    import { appendMessage, createChat, getChat } from "./api";
    import { getDisplayName, profileStore } from "../stores/profile";
    import {
        FALLBACK_MODEL_ID,
        getModels,
        type ModelOption,
    } from "../api/model";

    let { chatId: routeChatId = null } = $props<{ chatId?: string | null }>();

    const chatHistory = $state<ChatMessage[]>([]);
    const isChatting = $derived(chatHistory.length > 0);
    const name = $derived(getDisplayName($profileStore));
    let flashMessage = $state("");
    let activeChatId = $state<string | null>(null);
    let isSending = $state(false);
    let isLoading = $state(true);
    let loadError = $state("");
    let models = $state<ModelOption[]>([]);
    let selectedModelId = $state($profileStore?.defaultModel ?? FALLBACK_MODEL_ID);
    let modelError = $state("");
    const modelPickerDisabled = $derived(
        isSending || activeChatId !== null || isChatting,
    );

    /** Loads selectable models and chooses a valid fallback for a new chat. */
    async function loadModelOptions() {
        modelError = "";

        try {
            models = await getModels();
            if (!routeChatId && !models.some((model) => model.id === selectedModelId)) {
                selectedModelId =
                    models.find((model) => model.id === FALLBACK_MODEL_ID)?.id ??
                    models[0]?.id ??
                    "";
            }
        } catch (error) {
            console.error(error);
            modelError = "Models could not be loaded.";
        }
    }

    /** Loads the routed chat history into the current conversation. */
    async function loadChatHistory() {
        if (!routeChatId) return;

        isLoading = true;
        loadError = "";

        try {
            const chat = await getChat(routeChatId);
            chatHistory.splice(0, chatHistory.length, ...chat.messages);
            activeChatId = routeChatId;
            selectedModelId = chat.model;
        } catch (error) {
            console.error(error);
            loadError = "This chat could not be loaded.";
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        void loadModelOptions();
        if (routeChatId) {
            void loadChatHistory();
        } else {
            isLoading = false;
        }
    });

    /** Identifies the API error returned when a user cannot afford a response. */
    function isInsufficientCreditsError(error: unknown) {
        return (
            error instanceof Error &&
            "code" in error &&
            error.code === "INSUFFICIENT_CREDITS"
        );
    }

    /** Streams a model response into local history and returns it when complete. */
    async function streamResponse(history: ChatMessage[], model: string) {
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
        if (isSending || !selectedModelId) return;

        flashMessage = "";
        isSending = true;
        chatHistory.push(message);
        const model = selectedModelId;

        try {
            const modelMessage = await streamResponse([...chatHistory], model);

            if (!activeChatId) {
                const chat = await createChat(message.text.slice(0, 60), model);
                activeChatId = chat._id;
            }

            await appendMessage(activeChatId, message);
            await appendMessage(activeChatId, modelMessage);
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

    /** Selects the model used when creating the next chat. */
    function selectModel(modelId: string) {
        selectedModelId = modelId;
    }
</script>

<section class="chat-welcome" aria-label="New chat">
    <div class="welcome-content">
        {#if isLoading}
            <p class="chat-load-status" role="status">Loading chat...</p>
        {:else if loadError}
            <div class="chat-load-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onclick={loadChatHistory}>Try again</button>
            </div>
        {:else}
            {#if !isChatting}
                <h1>Good <span>evening</span>, {name}</h1>
                <p>What are we working on today?</p>
            {/if}
            {#if isChatting}
                <MessageHistory {chatHistory} />
            {/if}

            <MessageInput
                onSend={handleSend}
                {models}
                {selectedModelId}
                onModelSelect={selectModel}
                disabled={isSending || models.length === 0}
                {modelPickerDisabled}
            />

            {#if modelError}
                <div class="model-load-error" role="alert">
                    <span>{modelError}</span>
                    <button type="button" onclick={loadModelOptions}>Try again</button>
                </div>
            {/if}

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
        {/if}
    </div>
</section>
