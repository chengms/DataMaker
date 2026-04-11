import type { LlmProviderSettings } from "@/types/settings";

export type BuiltInProvider = "siliconflow" | "minimax";

export const PROVIDER_LABELS: Record<BuiltInProvider, string> = {
  siliconflow: "SiliconFlow",
  minimax: "MiniMax",
};

const BASE_PROVIDER_PRESETS: Record<BuiltInProvider, LlmProviderSettings> = {
  siliconflow: {
    provider: "siliconflow",
    apiKey: "",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "zai-org/GLM-5",
    temperature: 0.7,
  },
  minimax: {
    provider: "minimax",
    apiKey: "",
    baseUrl: "https://api.minimaxi.com/v1",
    model: "MiniMax-M2.7",
    temperature: 0.7,
  },
};

export function getProviderPreset(provider: string): LlmProviderSettings {
  return BASE_PROVIDER_PRESETS[provider as BuiltInProvider] || BASE_PROVIDER_PRESETS.siliconflow;
}

export function getBuiltInProviders(): BuiltInProvider[] {
  return ["siliconflow", "minimax"];
}
