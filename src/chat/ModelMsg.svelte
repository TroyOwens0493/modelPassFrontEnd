<script lang="ts">
    let { text, timestamp, modelName } = $props<{
        text: string;
        timestamp: Date;
        modelName: string;
    }>();

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });
</script>

<article class="model-message">
    <div class="model-mark" aria-hidden="true">M</div>
    <div class="message-content">
        <div class="message-header">
            <strong>{modelName}</strong>
            <time datetime={timestamp.toISOString()}>
                {timeFormatter.format(timestamp)}
            </time>
        </div>
        <p>{text}</p>
    </div>
</article>

<style>
    .model-message {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 11px;
    }

    .model-mark {
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: var(--accent);
        color: #1a1714;
        font-size: 13px;
        font-weight: 700;
    }

    .message-content {
        min-width: 0;
        flex: 1;
        padding-top: 3px;
    }

    .message-header {
        display: flex;
        align-items: baseline;
        gap: 9px;
        margin-bottom: 6px;
    }

    strong {
        color: #e8ddcf;
        font-size: 13px;
        font-weight: 600;
    }

    time {
        color: var(--muted);
        font-size: 11px;
    }

    p {
        margin: 0;
        color: var(--soft);
        font-size: 15px;
        line-height: 1.6;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }
</style>
