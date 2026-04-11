import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { VideoScriptContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const videoScriptContentSchema = z.object({
  title: z.string().min(1),
  duration: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  transition: z.string().min(1),
  endingCta: z.string().min(1),
  voiceoverNotes: z.string().min(1),
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

function buildVideoScriptPrompt(input: TaskInput, settings: AppSettings) {
  return [
    "请根据下面的创作需求，输出一个适合短视频口播的脚本。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        title: "string",
        duration: "string",
        hook: "string",
        body: "string",
        transition: "string",
        endingCta: "string",
        voiceoverNotes: "string",
      },
      null,
      2,
    ),
    "写作要求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.video_script.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.video_script.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.video_script.extraRules || "无"}`,
    "- hook 必须适合前三秒表达。",
    "- body 直接输出口播内容，不要写分镜编号。",
    "- voiceoverNotes 说明语速、强调点或表演提示。",
  ].join("\n");
}

export async function generateVideoScriptContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<VideoScriptContent> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: settings.video_script.systemPrompt,
    },
    {
      role: "user",
      content: buildVideoScriptPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return videoScriptContentSchema.parse(parsed);
}
