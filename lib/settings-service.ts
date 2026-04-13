import { prisma } from "@/lib/prisma";
import { getDefaultAppSettings, getDefaultPlatformPromptConfig } from "@/lib/default-settings";
import { getProviderSettingsFromEnv } from "@/lib/provider-env";
import { serializeSettings } from "@/lib/task-serializers";
import type { AppSettings, LlmProviderSettings, PlatformPromptConfig } from "@/types/settings";

function normalizePlatformPrompts(value: PlatformPromptConfig | undefined) {
  return {
    wechat: value?.wechat ?? "",
    xiaohongshu: value?.xiaohongshu ?? "",
    twitter: value?.twitter ?? "",
    video_script: value?.video_script ?? "",
  };
}

export function normalizeSettings(input: unknown): AppSettings {
  const defaults = getDefaultAppSettings();
  const value = (input ?? {}) as Partial<AppSettings>;
  const provider: Partial<LlmProviderSettings> = value.provider ?? {};
  const preset = getProviderSettingsFromEnv(provider.provider || defaults.provider.provider);

  return {
    provider: {
      provider: provider.provider || preset.provider,
      apiKey: provider.apiKey || defaults.provider.apiKey || preset.apiKey,
      baseUrl: provider.baseUrl || preset.baseUrl,
      model: provider.model || preset.model,
      temperature: provider.temperature ?? preset.temperature ?? defaults.provider.temperature,
    },
    platformPrompts: normalizePlatformPrompts(value.platformPrompts),
    wechat: {
      ...defaults.wechat,
      ...(value.wechat ?? {}),
    },
    xiaohongshu: {
      ...defaults.xiaohongshu,
      ...(value.xiaohongshu ?? {}),
    },
    twitter: {
      ...defaults.twitter,
      ...(value.twitter ?? {}),
    },
    video_script: {
      ...defaults.video_script,
      ...(value.video_script ?? {}),
    },
  };
}

export function getDefaultSettings() {
  return {
    ...getDefaultAppSettings(),
    platformPrompts: getDefaultPlatformPromptConfig(),
  };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(settings);

  const updated = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { settings: normalized },
    create: {
      id: "default",
      settings: normalized,
    },
  });

  return serializeSettings(updated);
}

export async function getOrCreateSettings(): Promise<AppSettings> {
  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      settings: getDefaultAppSettings(),
    },
  });

  const normalized = normalizeSettings(settings.settings);

  if (JSON.stringify(settings.settings) !== JSON.stringify(normalized)) {
    return saveSettings(normalized);
  }

  return normalized;
}
