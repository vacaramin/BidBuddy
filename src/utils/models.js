import openaiLogo from "@/assets/icons/openai.svg";
import claudeLogo from "@/assets/icons/claude.svg";

export const PROVIDERS = [
  {
    id: "openai",
    name: "ChatGPT",
    logo: openaiLogo,
    defaultModel: "gpt-6.1-sol",
    models: [
      { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", note: "Recommended" },
      { id: "gpt-6-astra", name: "GPT-6 Astra", note: "Most capable" },
      { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", note: "Writing" },
      { id: "gpt-6-luna", name: "GPT-6 Luna", note: "Fast" },
    ],
  },
  {
    id: "anthropic",
    name: "Claude",
    logo: claudeLogo,
    defaultModel: "claude-sonnet-5-5",
    models: [
      {
        id: "claude-sonnet-5-5",
        name: "Claude Sonnet 5.5",
        note: "Recommended",
      },
      { id: "claude-opus-5-5", name: "Claude Opus 5.5", note: "Most capable" },
      {
        id: "claude-fable-5-1",
        name: "Claude Fable 5.1",
        note: "Deep reasoning",
      },
      { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", note: "Fast" },
    ],
  },
];

export const getProvider = (providerId) =>
  PROVIDERS.find((provider) => provider.id === providerId);

export const getModels = (providerId) => getProvider(providerId)?.models ?? [];

export const getDefaultModel = (providerId) =>
  getProvider(providerId)?.defaultModel ?? "";
