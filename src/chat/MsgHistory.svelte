<script lang="ts">
    import ModelMsg from "./ModelMsg.svelte";
    import type { ChatMessage } from "./types";
    import UserMsg from "./UserMsg.svelte";

    let { chatHistory, modelName } = $props<{
        chatHistory: ChatMessage[];
        modelName: string;
    }>();
</script>

<section class="message-history" aria-label="Message history">
    {#each chatHistory as message}
        {#if message.role === "user"}
            <UserMsg text={message.text} timestamp={message.timestamp} />
        {:else}
            <ModelMsg text={message.text} timestamp={message.timestamp} {modelName} />
        {/if}
    {/each}
</section>

<style>
    .message-history {
        width: 100%;
        min-height: 0;
        max-height: calc(100dvh - 250px);
        overflow-y: auto;
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 20px;
        padding: 4px 8px 4px 0;
        scrollbar-gutter: stable;
    }

    @media (max-width: 720px) {
        .message-history {
            max-height: calc(100dvh - 220px);
        }
    }
</style>
