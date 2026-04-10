export type PlatformPromptSettings = {
  enabled: boolean;
  systemPrompt: string;
  defaultTone?: string;
  defaultLength?: string;
  extraRules?: string;
};

export type AppSettings = {
  wechat: PlatformPromptSettings;
  xiaohongshu: PlatformPromptSettings;
  twitter: PlatformPromptSettings;
  video_script: PlatformPromptSettings;
};
