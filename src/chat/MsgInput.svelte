<script lang="ts">
    import type { ChatMessage } from "./types";

    let { onSend, disabled = false } = $props<{
        onSend: (message: ChatMessage) => void;
        disabled?: boolean;
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
            <button
                class="model-pill"
                type="button"
                aria-label="Selected model"
            >
                <span class="model-dot" aria-hidden="true"></span>
                GPT-5.5
                <span aria-hidden="true">⌄</span>
            </button>

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
