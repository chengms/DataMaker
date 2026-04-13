import type {
  AppSettings,
  LlmProviderSettings,
  PlatformPromptConfig,
  PlatformPromptSettings,
} from "@/types/settings";
import { getServerEnvValue } from "@/lib/server-env";
import { getProviderSettingsFromEnv } from "@/lib/provider-env";

function getDefaultProviderSettings(): LlmProviderSettings {
  const defaultProvider = getServerEnvValue("LLM_PROVIDER") || "siliconflow";
  const preset = getProviderSettingsFromEnv(defaultProvider);

  return {
    ...preset,
    apiKey: getServerEnvValue("LLM_API_KEY") || preset.apiKey || "",
    baseUrl: getServerEnvValue("LLM_BASE_URL") || preset.baseUrl,
    model: getServerEnvValue("LLM_MODEL") || preset.model,
    temperature: Number(getServerEnvValue("LLM_TEMPERATURE") || String(preset.temperature || 0.7)),
  };
}

const DEFAULT_PLATFORM_SETTINGS: Record<
  "wechat" | "xiaohongshu" | "twitter" | "video_script",
  PlatformPromptSettings
> = {
  wechat: {
    enabled: true,
    systemPrompt:
      "你是一个擅长公众号长文结构化写作的内容策略助手，输出需要兼顾信息密度、可读性和 CTA。",
    defaultTone: "专业、可信",
    defaultLength: "1200-1800 字",
    extraRules: "标题避免空泛；每段尽量有明确观点；结尾包含行动建议。",
  },
  xiaohongshu: {
    enabled: true,
    systemPrompt:
      "你是一个擅长小红书种草与经验分享的内容编辑，输出要强调开头吸引力、段落节奏和标签。",
    defaultTone: "真实、轻快",
    defaultLength: "400-700 字",
    extraRules: "标题要明确收益点；正文分段短；标签控制在 3-6 个。",
  },
  twitter: {
    enabled: true,
    systemPrompt:
      "你是一个擅长英文社媒表达与信息压缩的创作者，输出应简洁、有观点，并适配 single 与 thread 两种模式。",
    defaultTone: "sharp, concise",
    defaultLength: "single 280 chars / thread 3-5 tweets",
    extraRules: "开头要有 hook；thread 每条单独可读；避免堆砌 emoji。",
  },
  video_script: {
    enabled: true,
    systemPrompt:
      "你是一个短视频脚本策划助手，输出需要包含 hook、主体推进、转场和结尾 CTA。",
    defaultTone: "有节奏、口语化",
    defaultLength: "60-120 秒",
    extraRules: "前三秒抓人；转场明确；结尾 CTA 直接。",
  },
};

export const DEFAULT_PLATFORM_PROMPTS: Required<PlatformPromptConfig> = {
  wechat:
    "保持公众号长文的编辑感与阅读节奏。开头先交代为什么值得读，中段按问题拆解，小标题清晰，结尾给出可执行 CTA。",
  xiaohongshu:
    "保持小红书图文笔记的真实分享感。标题先给收益点，正文分段更短，语气更像经验复盘，适度保留互动感。",
  twitter:
    "保持 Twitter/X 的压缩表达。观点前置，句子短，hook 明确；thread 模式下每条都要独立成立但能串成一条线。",
  video_script:
    "保持短视频脚本的镜头感和口播感。前三秒抓人，后续推进节奏明显，结尾 CTA 直接，备注里补足表演与画面提示。",
};

export function getDefaultPlatformPromptConfig(): Required<PlatformPromptConfig> {
  return { ...DEFAULT_PLATFORM_PROMPTS };
}

export function getDefaultAppSettings(): AppSettings {
  return {
    provider: getDefaultProviderSettings(),
    platformPrompts: {
      wechat: "",
      xiaohongshu: "",
      twitter: "",
      video_script: "",
    },
    wechat: DEFAULT_PLATFORM_SETTINGS.wechat,
    xiaohongshu: DEFAULT_PLATFORM_SETTINGS.xiaohongshu,
    twitter: DEFAULT_PLATFORM_SETTINGS.twitter,
    video_script: DEFAULT_PLATFORM_SETTINGS.video_script,
  };
}
