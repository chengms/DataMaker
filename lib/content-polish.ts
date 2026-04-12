import { z } from "zod";

import { extractJsonObject } from "@/lib/ai-json";
import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type {
  PlatformType,
  TaskContents,
  TwitterContent,
  VideoScriptContent,
  WechatContent,
  XiaohongshuContent,
} from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const wechatSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sections: z
    .array(
      z.object({
        heading: z.string().optional(),
        body: z.string().min(1),
        quote: z.string().optional(),
        imagePlaceholder: z.string().optional(),
      }),
    )
    .min(1),
  cta: z.string().min(1),
});

const xiaohongshuSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        url: z.string().optional(),
        placeholder: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1)
    .max(9),
  title: z.string().min(1),
  body: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(1).max(6),
});

const twitterSchema = z.union([
  z.object({
    mode: z.literal("single"),
    text: z.string().min(1).max(280),
  }),
  z.object({
    mode: z.literal("thread"),
    tweets: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1).max(280),
        }),
      )
      .min(2)
      .max(8),
  }),
]);

const videoScriptSchema = z.object({
  title: z.string().min(1),
  duration: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  transition: z.string().min(1),
  endingCta: z.string().min(1),
  voiceoverNotes: z.string().min(1),
});

function buildPolishPrompt(platform: PlatformType, input: TaskInput, content: unknown) {
  return [
    "请对下面的内容做“降 AI 风格”优化。",
    "目标不是改主题，而是把文风改得更自然、更像真实作者写出来的版本。",
    "必须保留原有事实、平台结构、主要观点和 CTA。",
    "请减少以下问题：模板腔、空泛套话、机械并列、过度总结、过于均匀的句式、明显 AI 连接词。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    `当前平台：${platform}`,
    "写作约束：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    "- 允许微调句子和段落，但不要改变结构字段名。",
    "- Twitter 每条仍必须控制在 280 字以内。",
    "当前内容 JSON：",
    JSON.stringify(content, null, 2),
  ].join("\n");
}

export async function polishPlatformContent(
  platform: PlatformType,
  input: TaskInput,
  contents: TaskContents,
  settings: AppSettings,
) {
  const currentContent = contents[platform];

  if (!currentContent) {
    throw new Error("当前平台还没有可优化的内容");
  }

  const completion = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content:
        "你是一位内容总编，擅长在不改变信息结构的前提下，把 AI 生成文案改得更自然、更有人写作痕迹、更贴近真实发布风格。",
    },
    {
      role: "user",
      content: buildPolishPrompt(platform, input, currentContent),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(completion)) as unknown;

  switch (platform) {
    case "wechat":
      return wechatSchema.parse(parsed) as WechatContent;
    case "xiaohongshu":
      return xiaohongshuSchema.parse(parsed) as XiaohongshuContent;
    case "twitter":
      return twitterSchema.parse(parsed) as TwitterContent;
    case "video_script":
      return videoScriptSchema.parse(parsed) as VideoScriptContent;
  }
}
