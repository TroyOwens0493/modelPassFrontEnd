<script lang="ts">
    import type { ChatMessage } from "./types";
    import ModelPicker from "./ModelPicker.svelte";
    import type { ModelOption } from "../api/model";

    let {
        onSend,
        models,
        selectedModelId,
        onModelSelect,
        disabled = false,
        modelPickerDisabled = false,
    } = $props<{
        onSend: (message: ChatMessage) => void;
        models: ModelOption[];
        selectedModelId: string;
        onModelSelect: (modelId: string) => void;
        disabled?: boolean;
        modelPickerDisabled?: boolean;
    }>();

    const placeholder = "Ask me anything...";
    let query = $state("");

    /** Sends a non-empty user message and clears the composer. */
    function sendMsg() {
        const text = query.trim();
        if (!text) return;

        const newMsg: ChatMessage = {
            timestamp: new Date(),
            role: "user",
            text
        };
        onSend(newMsg);
        query = "";
    }
</script>

<div class="message-input">
    <textarea aria-label="Message" {placeholder} bind:value={query} {disabled}></textarea>

    <div class="composer-actions">
        <div class="composer-left">
            <ModelPicker
                {models}
                selectedId={selectedModelId}
                onSelect={onModelSelect}
                disabled={modelPickerDisabled}
            />

            <button class="icon-button" type="button" aria-label="Attach file">
                +
            </button>
        </div>

        <button
            class="send-button"
            type="button"
            aria-label="Send message"
            disabled={disabled || !query.trim()}
            onclick={sendMsg}
        >
            ↑
        </button>
    </div>
</div>
