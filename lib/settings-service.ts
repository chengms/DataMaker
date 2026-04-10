import { prisma } from "@/lib/prisma";
import { getDefaultAppSettings } from "@/lib/default-settings";
import { serializeSettings } from "@/lib/task-serializers";
import type { AppSettings, LlmProviderSettings } from "@/types/settings";

export function normalizeSettings(input: unknown): AppSettings {
  const defaults = getDefaultAppSettings();
  const value = (input ?? {}) as Partial<AppSettings>;
  const provider: Partial<LlmProviderSettings> = value.provider ?? {};

  return {
    provider: {
      provider: provider.provider || defaults.provider.provider,
      apiKey: provider.apiKey || defaults.provider.apiKey,
      baseUrl: provider.baseUrl || defaults.provider.baseUrl,
      model: provider.model || defaults.provider.model,
      temperature: provider.temperature ?? defaults.provider.temperature,
    },
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
  return getDefaultAppSettings();
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
