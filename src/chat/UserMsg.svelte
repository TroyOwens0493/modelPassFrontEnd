<script lang="ts">
    let { text, timestamp } = $props<{
        text: string;
        timestamp: Date;
    }>();

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });
</script>

<article class="user-message">
    <div class="message-content">
        <p>{text}</p>
        <time datetime={timestamp.toISOString()}>
            {timeFormatter.format(timestamp)}
        </time>
    </div>
</article>

<style>
    .user-message {
        width: 100%;
        display: flex;
        justify-content: flex-end;
    }

    .message-content {
        max-width: min(82%, 460px);
        padding: 11px 14px 8px;
        border: 1px solid rgba(255, 240, 220, 0.08);
        border-radius: 16px 16px 4px 16px;
        background: #2b2621;
    }

    p {
        margin: 0;
        color: #eee6dc;
        font-size: 15px;
        line-height: 1.5;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    time {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 10.5px;
        text-align: right;
    }

    @media (max-width: 520px) {
        .message-content {
            max-width: 90%;
        }
    }
</style>
