import { getDefaultPlatformPromptConfig } from "@/lib/default-settings";
import type { PlatformType } from "@/types/content";
import type { AppSettings } from "@/types/settings";

export type PlatformPromptSource = "user_custom" | "default" | "none";

export function normalizeEditablePrompt(prompt?: string) {
  return prompt?.replace(/\r\n/g, "\n").trim() ?? "";
}

export function resolvePlatformPrompt(platform: PlatformType, settings: AppSettings) {
  const defaultPrompts = getDefaultPlatformPromptConfig();
  const userCustomPrompt = normalizeEditablePrompt(settings.platformPrompts?.[platform]);
  const defaultPlatformPrompt = normalizeEditablePrompt(defaultPrompts[platform]);
  const platformPrompt = userCustomPrompt || defaultPlatformPrompt || "";
  const source: PlatformPromptSource = userCustomPrompt
    ? "user_custom"
    : defaultPlatformPrompt
      ? "default"
      : "none";

  return {
    userCustomPrompt,
    defaultPlatformPrompt,
    platformPrompt,
    source,
  };
}

export function buildFinalSystemPrompt(
  platform: PlatformType,
  settings: AppSettings,
  runtimeConstraintsPrompt?: string,
) {
  const baseSystemPrompt = settings[platform].systemPrompt;
  const resolved = resolvePlatformPrompt(platform, settings);

  const finalSystemPrompt = [
    baseSystemPrompt,
    resolved.platformPrompt,
    runtimeConstraintsPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  console.info("[prompt] assembled", {
    platform,
    source: resolved.source,
    baseLength: baseSystemPrompt.length,
    platformPromptLength: resolved.platformPrompt.length,
    runtimeConstraintsLength: runtimeConstraintsPrompt?.length ?? 0,
    finalPromptLength: finalSystemPrompt.length,
  });

  return {
    ...resolved,
    baseSystemPrompt,
    runtimeConstraintsPrompt: runtimeConstraintsPrompt || "",
    finalSystemPrompt,
  };
}
