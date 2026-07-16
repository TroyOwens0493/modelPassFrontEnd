import { getApiPath } from "../api";

export const FALLBACK_MODEL_ID = "openai/gpt-4o-mini";

export type ModelOption = {
    id: string;
    name: string;
    contextLength: number;
    priceTier: number;
};

type ModelsResponse = {
    models: ModelOption[];
};

let catalogRequest: Promise<ModelOption[]> | null = null;

/** Loads the shared selectable model catalog once per browser session. */
export function getModels() {
    if (!catalogRequest) {
        catalogRequest = fetch(getApiPath("/api/models"), {
            credentials: "include",
        })
            .then(async (response) => {
                const body = (await response.json().catch(() => ({}))) as Partial<ModelsResponse> & {
                    error?: string;
                };

                if (!response.ok || !Array.isArray(body.models)) {
                    throw new Error(body.error ?? "Unable to load models");
                }

                return body.models;
            })
            .catch((error: unknown) => {
                catalogRequest = null;
                throw error;
            });
    }

    return catalogRequest;
}
