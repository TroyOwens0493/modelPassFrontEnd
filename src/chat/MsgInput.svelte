<script lang="ts">
    import { onMount } from "svelte";
    import type { ChatMessage } from "./types";
    import type { ChatModelOption } from "./modelOptions";

    let { onSend, selectedModel = $bindable(), models } = $props<{
        onSend: (message: ChatMessage) => void;
        selectedModel?: string;
        models: ChatModelOption[];
    }>();

    const placeholder = "Ask me anything...";
    let query = $state("");
    let isModelMenuOpen = $state(false);
    let pickerEl: HTMLDivElement | undefined;

    const selectedModelLabel = $derived(
        models.find((model: ChatModelOption) => model.slug === selectedModel)?.label ?? "Select model"
    );

    function closeModelMenu() {
        isModelMenuOpen = false;
    }

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!pickerEl?.contains(event.target as Node)) {
                closeModelMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

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
    <textarea aria-label="Message" {placeholder} bind:value={query}></textarea>

    <div class="composer-actions">
        <div class="composer-left">
            <div class="model-picker" bind:this={pickerEl}>
                <button
                    class="model-pill"
                    type="button"
                    aria-label="Selected model"
                    onclick={() => (isModelMenuOpen = !isModelMenuOpen)}
                >
                    <span class="model-dot" aria-hidden="true"></span>
                    {selectedModelLabel}
                    <span aria-hidden="true">⌄</span>
                </button>

                {#if isModelMenuOpen}
                    <div class="model-menu" role="listbox" aria-label="Choose a model">
                        {#each models as model}
                            <button
                                class="model-menu-item"
                                type="button"
                                role="option"
                                aria-selected={selectedModel === model.slug}
                                onclick={() => {
                                    selectedModel = model.slug;
                                    isModelMenuOpen = false;
                                }}
                            >
                                <span class="model-menu-title">{model.label}</span>
                                <span class="model-menu-description">{model.description}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <button class="icon-button" type="button" aria-label="Attach file">
                +
            </button>
        </div>

        <button
            class="send-button"
            type="button"
            aria-label="Send message"
            disabled={!query.trim()}
            onclick={sendMsg}
        >
            ↑
        </button>
    </div>
</div>
