<script lang="ts">
    let { placeholder = "Ask anything, in plain words..." } = $props<{
        placeholder?: string;
    }>();
</script>

<div class="message-input">
    <textarea aria-label="Message" {placeholder}></textarea>

    <div class="composer-actions">
        <div class="composer-left">
            <button class="model-pill" type="button" aria-label="Selected model">
                <span class="model-dot" aria-hidden="true"></span>
                GPT-4o mini
                <span aria-hidden="true">⌄</span>
            </button>

            <button class="icon-button" type="button" aria-label="Attach file">
                +
            </button>
        </div>

        <button class="send-button" type="button" aria-label="Send message">
            ↑
        </button>
    </div>
</div>
