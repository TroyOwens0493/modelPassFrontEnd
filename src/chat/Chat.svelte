<script lang="ts">
    import MessageInput from "./MsgInput.svelte";
    import "./chat.css";
    const isChatting = $state(false);
</script>

<section class="chat-welcome" aria-label="New chat">
    <div class="welcome-content">
        {#if !isChatting}
            <h1>Good <span>evening</span>, Sam</h1>
            <p>What are we working on today?</p>
        {/if}

        <MessageInput />

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
