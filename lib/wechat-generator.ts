import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import { buildFinalSystemPrompt } from "@/lib/platform-prompt-settings";
import type { WechatContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const wechatContentSchema = z.object({
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
    .min(3),
  cta: z.string().min(1),
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

function buildWechatPrompt(input: TaskInput, settings: AppSettings) {
  const sections: string[] = [
    "请根据下面的创作需求，输出一篇适合公众号发布的文章。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        title: "string",
        summary: "string",
        sections: [
          {
            heading: "string",
            body: "string",
            quote: "string",
            imagePlaceholder: "string",
          },
        ],
        cta: "string",
      },
      null,
      2,
    ),
    "创作需求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.wechat.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.wechat.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.wechat.extraRules || "无"}`,
  ];

  // 如果有真实文章素材，附加到 prompt 中
  if (input.sourceArticles && input.sourceArticles.length > 0) {
    const articleList = input.sourceArticles
      .slice(0, 5)
      .map(
        (article, index) =>
          `[素材 ${index + 1}] ${article.title}\n作者：${article.creator}\n平台：${article.platform}\n摘要：${article.summary}\n正文片段：${article.plainTextContent.slice(0, 1500)}`,
      )
      .join("\n\n");
    sections.push(
      "\n参考素材（来自 DataAgent 内容池，请基于这些真实内容进行创作）：",
      articleList,
      "\n注意：请充分利用上述素材中的真实信息和数据，使生成的文章更具可信度和深度。",
    );
  }

  sections.push(
    "- 文章要有明确标题、摘要、3-5 个 section，以及结尾 CTA。",
    "- section.body 要写成可直接发布的自然段，不要只写要点。",
    "- 如果有适合配图的位置，可以在 imagePlaceholder 中给出简短建议。",
  );

  return sections.join("\n");
}

export async function generateWechatContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<WechatContent> {
  const { finalSystemPrompt } = buildFinalSystemPrompt(
    "wechat",
    settings,
    "运行时约束：必须输出公众号结构化长文 JSON，保留标题、摘要、sections 和 CTA。",
  );
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: finalSystemPrompt,
    },
    {
      role: "user",
      content: buildWechatPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return wechatContentSchema.parse(parsed);
}
