import { getProviderPreset } from "@/lib/provider-presets";
import { getServerEnvValue } from "@/lib/server-env";
import type { LlmProviderSettings } from "@/types/settings";

export function getProviderSettingsFromEnv(provider: string): LlmProviderSettings {
  const preset = getProviderPreset(provider);

  if (provider === "minimax") {
    return {
      ...preset,
      apiKey: getServerEnvValue("MINIMAX_API_KEY") || "",
      baseUrl: getServerEnvValue("MINIMAX_BASE_URL") || preset.baseUrl,
      model: getServerEnvValue("MINIMAX_MODEL") || preset.model,
      temperature: Number(getServerEnvValue("MINIMAX_TEMPERATURE") || String(preset.temperature || 0.7)),
    };
  }

  return {
    ...preset,
    apiKey: getServerEnvValue("SILICONFLOW_API_KEY") || getServerEnvValue("LLM_API_KEY") || "",
    baseUrl: getServerEnvValue("SILICONFLOW_BASE_URL") || preset.baseUrl,
    model: getServerEnvValue("SILICONFLOW_MODEL") || preset.model,
    temperature: Number(
      getServerEnvValue("SILICONFLOW_TEMPERATURE") || String(preset.temperature || 0.7),
    ),
  };
}
