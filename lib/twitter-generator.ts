import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import { buildFinalSystemPrompt } from "@/lib/platform-prompt-settings";
import type { TwitterContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const twitterSingleSchema = z.object({
  mode: z.literal("single"),
  text: z.string().min(1).max(280),
});

const twitterThreadSchema = z.object({
  mode: z.literal("thread"),
  tweets: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(280),
      }),
    )
    .min(2)
    .max(6),
});

const twitterContentSchema = z.union([twitterSingleSchema, twitterThreadSchema]);

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}

function buildTwitterPrompt(input: TaskInput, settings: AppSettings) {
  const mode = input.twitterMode || "single";

  const sections: string[] = [
    "请根据下面的创作需求，输出适合 Twitter/X 发布的内容。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    `输出模式必须是：${mode}`,
    "当 mode 为 single 时，JSON 结构必须是：",
    JSON.stringify({ mode: "single", text: "string" }, null, 2),
    "当 mode 为 thread 时，JSON 结构必须是：",
    JSON.stringify({ mode: "thread", tweets: [{ id: "string", text: "string" }] }, null, 2),
    "创作需求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.twitter.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.twitter.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.twitter.extraRules || "无"}`,
  ];

  if (input.sourceArticles && input.sourceArticles.length > 0) {
    const articleList = input.sourceArticles
      .slice(0, 3)
      .map(
        (article, index) =>
          `[素材 ${index + 1}] ${article.title}\n摘要：${article.summary}`,
      )
      .join("\n\n");
    sections.push(
      "\n参考素材（来自 DataAgent 内容池）：",
      articleList,
      "\n注意：可提炼素材中的核心观点用于推文，每条 tweet 不超过 280 字符。",
    );
  }

  sections.push(
    "- 每条 tweet 都要独立可读。",
    "- 不要使用 markdown 列表。",
    "- 不要超过 280 个字符。",
  );

  return sections.join("\n");
}

export async function generateTwitterContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<TwitterContent> {
  const { finalSystemPrompt } = buildFinalSystemPrompt(
    "twitter",
    settings,
    `运行时约束：必须输出 Twitter/X JSON，模式固定为 ${input.twitterMode || "single"}，每条内容不能超过 280 字符。`,
  );
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: finalSystemPrompt,
    },
    {
      role: "user",
      content: buildTwitterPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return twitterContentSchema.parse(parsed);
}
