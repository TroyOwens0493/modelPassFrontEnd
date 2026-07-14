<script lang="ts">
    import MessageInput from "./MsgInput.svelte";
    import type { ChatMessage } from "./types";
    import "./chat.css";

    const chatHistory = $state<ChatMessage[]>([]);
    const isChatting = $derived(chatHistory.length > 0);

    /** Adds a newly submitted message to this chat. */
    function handleSend(message: ChatMessage) {
        chatHistory.push(message);
    }
</script>

<section class="chat-welcome" aria-label="New chat">
    <div class="welcome-content">
        {#if !isChatting}
            <h1>Good <span>evening</span>, Sam</h1>
            <p>What are we working on today?</p>
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
