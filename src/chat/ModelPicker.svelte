<script lang="ts">
    import { tick } from "svelte";
    import type { ModelOption } from "../api/model";

    let {
        models,
        selectedId,
        onSelect,
        disabled = false,
        ariaLabel = "Selected model",
    } = $props<{
        models: ModelOption[];
        selectedId: string;
        onSelect: (modelId: string) => void;
        disabled?: boolean;
        ariaLabel?: string;
    }>();

    let container: HTMLDivElement;
    let trigger: HTMLButtonElement;
    let searchInput = $state<HTMLInputElement>();
    let isOpen = $state(false);
    let query = $state("");
    const selectedModel = $derived(
        models.find((model: ModelOption) => model.id === selectedId),
    );
    const filteredModels = $derived(
        models.filter((model: ModelOption) =>
            model.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
        ),
    );

    /** Opens or closes the model list and focuses search when opened. */
    async function togglePicker() {
        if (disabled || models.length === 0) return;
        isOpen = !isOpen;
        query = "";

        if (isOpen) {
            await tick();
            searchInput?.focus();
        }
    }

    /** Selects a model and returns focus to the picker trigger. */
    function selectModel(modelId: string) {
        onSelect(modelId);
        isOpen = false;
        query = "";
        trigger.focus();
    }

    /** Closes the picker when the user clicks beyond its bounds. */
    function handleWindowClick(event: MouseEvent) {
        if (isOpen && !container.contains(event.target as Node)) {
            isOpen = false;
            query = "";
        }
    }

    /** Closes the picker when Escape is pressed. */
    function handleWindowKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === "Escape") {
            event.preventDefault();
            isOpen = false;
            query = "";
            trigger.focus();
        }
    }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="model-picker" bind:this={container}>
    <button
        class="model-picker-trigger"
        type="button"
        bind:this={trigger}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        {disabled}
        onclick={togglePicker}
    >
        <span class="model-picker-dot" aria-hidden="true"></span>
        <span class="model-picker-name">
            {selectedModel?.name ?? (models.length ? "Choose a model" : "Loading models...")}
        </span>
        <span aria-hidden="true">⌄</span>
    </button>

    {#if isOpen}
        <div class="model-picker-popover" role="dialog" aria-label="Choose a model">
            <input
                bind:this={searchInput}
                bind:value={query}
                type="search"
                aria-label="Search models"
                placeholder="Search models..."
            />

            <div class="model-picker-list">
                {#each filteredModels as model (model.id)}
                    <button
                        class:selected={model.id === selectedId}
                        type="button"
                        aria-pressed={model.id === selectedId}
                        onclick={() => selectModel(model.id)}
                    >
                        <span>{model.name}</span>
                        <span
                            class="model-price-tier"
                            aria-label={`Price tier ${model.priceTier} of 5`}
                        >{"$".repeat(model.priceTier)}</span>
                    </button>
                {:else}
                    <p>No models match your search.</p>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .model-picker {
        position: relative;
        z-index: 2147483647;
        min-width: 0;
    }

    .model-picker-trigger {
        display: flex;
        max-width: min(260px, 60vw);
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255, 240, 220, 0.07);
        border-radius: 10px;
        padding: 7px 11px;
        background: var(--input, #1a1714);
        color: var(--soft, #d8cfc5);
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
    }

    .model-picker-trigger:disabled {
        cursor: not-allowed;
        opacity: 0.65;
    }

    .model-picker-trigger:focus-visible,
    .model-picker-popover input:focus-visible,
    .model-picker-list button:focus-visible {
        outline: 2px solid var(--accent, #e8a04d);
        outline-offset: 2px;
    }

    .model-picker-dot {
        width: 7px;
        height: 7px;
        flex: 0 0 auto;
        border-radius: 50%;
        background: var(--accent, #e8a04d);
    }

    .model-picker-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .model-picker-popover {
        position: absolute;
        z-index: 20;
        bottom: calc(100% + 8px);
        left: 0;
        width: min(360px, calc(100vw - 40px));
        overflow: hidden;
        border: 1px solid rgba(255, 240, 220, 0.11);
        border-radius: 13px;
        background: #1d1916;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
    }

    .model-picker-popover input {
        width: calc(100% - 20px);
        margin: 10px;
        border: 1px solid rgba(255, 240, 220, 0.09);
        border-radius: 9px;
        padding: 9px 11px;
        background: #151210;
        color: #f2ece4;
        font: inherit;
        font-size: 13px;
    }

    .model-picker-list {
        max-height: 300px;
        overflow-y: auto;
        border-top: 1px solid rgba(255, 240, 220, 0.06);
        padding: 5px;
    }

    .model-picker-list button {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border: 0;
        border-radius: 8px;
        padding: 9px 10px;
        background: transparent;
        color: #d8cfc5;
        font: inherit;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
    }

    .model-picker-list button:hover,
    .model-picker-list button.selected {
        background: rgba(232, 160, 77, 0.11);
        color: #f2ece4;
    }

    .model-picker-list button > span:first-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .model-price-tier {
        flex: 0 0 auto;
        color: var(--accent, #e8a04d);
        font-size: 11px;
        letter-spacing: 0.04em;
    }

    .model-picker-list p {
        margin: 0;
        padding: 22px 12px;
        color: #8e8478;
        font-size: 13px;
        text-align: center;
    }
</style>
