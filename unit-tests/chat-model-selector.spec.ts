import { describe, expect, it } from 'vitest';
import { getAvailableModels } from '../src/chat/modelOptions';

describe('getAvailableModels', () => {
  it('exposes the default chat model options', () => {
    const models = getAvailableModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models[0].slug).toBe('openai/gpt-4o-mini');
    expect(models.map((model) => model.slug)).toContain('anthropic/claude-3.5-sonnet');
  });
});
