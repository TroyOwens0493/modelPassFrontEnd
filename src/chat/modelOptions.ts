export type ChatModelOption = {
  slug: string;
  label: string;
  description: string;
};

export function getAvailableModels(): ChatModelOption[] {
  return [
    {
      slug: 'openai/gpt-4o-mini',
      label: 'GPT-4o mini',
      description: 'Fast everyday answers',
    },
    {
      slug: 'anthropic/claude-3.5-sonnet',
      label: 'Claude Sonnet',
      description: 'Thoughtful writing and reasoning',
    },
    {
      slug: 'google/gemini-flash',
      label: 'Gemini Flash',
      description: 'Speedy with long documents',
    },
  ];
}
