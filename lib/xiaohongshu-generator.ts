import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { XiaohongshuContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const xiaohongshuContentSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
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

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}

function buildXiaohongshuPrompt(input: TaskInput, settings: AppSettings) {
  return [
    "请根据下面的创作需求，输出一篇适合小红书发布的图文内容。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        images: [{ id: "string", placeholder: "string", caption: "string" }],
        title: "string",
        body: "string",
        hashtags: ["string"],
      },
      null,
      2,
    ),
    "写作要求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.xiaohongshu.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.xiaohongshu.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.xiaohongshu.extraRules || "无"}`,
    "- images 返回 3 张图片建议，每张图片给出唯一 id、占位说明和图片 caption。",
    "- body 写成适合小红书阅读的自然分段，不要只写提纲。",
    "- hashtags 返回 3 到 6 个，不要带 # 前缀。",
  ].join("\n");
}

export async function generateXiaohongshuContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<XiaohongshuContent> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: settings.xiaohongshu.systemPrompt,
    },
    {
      role: "user",
      content: buildXiaohongshuPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return xiaohongshuContentSchema.parse(parsed);
}
