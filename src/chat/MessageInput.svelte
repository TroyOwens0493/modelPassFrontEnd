<script lang="ts">
    let { placeholder = "Ask anything, in plain words..." } = $props<{
        placeholder?: string;
    }>();
    let query = $state("");
</script>

<div class="message-input">
    <textarea aria-label="Message" {placeholder} bind:value={query}></textarea>

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
            disabled={!query}
        >
            ↑
        </button>
    </div>
</div>
