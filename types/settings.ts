import type { PlatformType } from "@/types/content";

export type PlatformPromptSettings = {
  enabled: boolean;
  systemPrompt: string;
  defaultTone?: string;
  defaultLength?: string;
  extraRules?: string;
};

export type LlmProviderSettings = {
  provider: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
  temperature?: number;
};

export type AppSettings = {
  provider: LlmProviderSettings;
  wechat: PlatformPromptSettings;
  xiaohongshu: PlatformPromptSettings;
  twitter: PlatformPromptSettings;
  video_script: PlatformPromptSettings;
};

export type SettingsSection = "provider" | PlatformType;
