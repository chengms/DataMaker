import type { PlatformType } from "@/types/content";

export type PlatformPromptConfig = {
  wechat?: string;
  xiaohongshu?: string;
  twitter?: string;
  video_script?: string;
};

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

export type ImageStylePreset =
  | "realistic"
  | "tech_illustration"
  | "minimal_flat"
  | "editorial"
  | "xiaohongshu_lifestyle"
  | "business_poster"
  | "modern_3d";

export type ImageGenerationSettings = {
  enabled: boolean;
  provider: "minimax";
  stylePreset: ImageStylePreset;
  customStylePrompt?: string;
};

export type AppSettings = {
  provider: LlmProviderSettings;
  platformPrompts: PlatformPromptConfig;
  imageGeneration: ImageGenerationSettings;
  dataAgent: DataAgentSettings;
  wechat: PlatformPromptSettings;
  xiaohongshu: PlatformPromptSettings;
  twitter: PlatformPromptSettings;
  video_script: PlatformPromptSettings;
};

export type DataAgentSettings = {
  enabled: boolean;
  baseUrl: string;
};

export type SettingsSection = "provider" | "image_generation" | "data_agent" | PlatformType;
