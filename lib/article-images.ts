import { IMAGE_NEGATIVE_HINT, IMAGE_STYLE_PRESET_LABELS, IMAGE_STYLE_PRESET_PROMPTS } from "@/lib/image-generation/presets";
import { generateMiniMaxImage } from "@/lib/image-generation/minimax";
import type {
  ArticleBlock,
  ArticleImagePlacement,
  ArticleImageSpec,
  PlatformType,
  WechatContent,
  XiaohongshuContent,
} from "@/types/content";
import type { AppSettings } from "@/types/settings";

const IMAGE_ENABLED_PLATFORMS: PlatformType[] = ["wechat", "xiaohongshu"];

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function summarizeText(text: string, limit = 80) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= limit ? cleaned : `${cleaned.slice(0, limit)}...`;
}

function createImageId(prefix: string, index: number) {
  return `${prefix}-${index + 1}-${crypto.randomUUID().slice(0, 8)}`;
}

function getPlatformImagePromptHint(platform: PlatformType, placement: ArticleImagePlacement) {
  if (platform === "wechat") {
    return placement === "cover"
      ? "适合作为公众号头图，强调阅读页的开篇气质与信息主题"
      : "适合作为公众号正文插图，帮助读者在长文中切换节奏并理解核心内容";
  }

  return placement === "cover"
    ? "适合作为小红书封面图，强调抓眼、清晰、可在信息流中快速理解"
    : "适合作为小红书内容配图，适合图文卡片流阅读节奏";
}

function getPlacementAspectRatio(platform: PlatformType, placement: ArticleImagePlacement) {
  if (platform === "wechat") {
    return placement === "cover" ? "16:9" : "4:3";
  }

  return placement === "cover" ? "3:4" : "1:1";
}

function buildFinalImagePrompt({
  semanticPrompt,
  purpose,
  platform,
  placement,
  settings,
}: {
  semanticPrompt: string;
  purpose: string;
  platform: PlatformType;
  placement: ArticleImagePlacement;
  settings: AppSettings;
}) {
  const stylePreset = settings.imageGeneration.stylePreset;
  const stylePresetPrompt = IMAGE_STYLE_PRESET_PROMPTS[stylePreset];
  const customStylePrompt = settings.imageGeneration.customStylePrompt?.trim();

  const prompt = [
    semanticPrompt,
    `usage: ${purpose}`,
    getPlatformImagePromptHint(platform, placement),
    `style preset: ${IMAGE_STYLE_PRESET_LABELS[stylePreset]}`,
    stylePresetPrompt,
    customStylePrompt,
    IMAGE_NEGATIVE_HINT,
  ]
    .filter(Boolean)
    .join(", ");

  return prompt.length <= 1400 ? prompt : `${prompt.slice(0, 1397)}...`;
}

function selectSectionIndexes(total: number, needed: number) {
  if (total <= 0 || needed <= 0) return [];
  if (needed >= total) return Array.from({ length: total }, (_, index) => index);

  const step = total / needed;
  const selected = new Set<number>();
  for (let index = 0; index < needed; index += 1) {
    selected.add(Math.min(total - 1, Math.floor(index * step)));
  }
  return Array.from(selected).sort((a, b) => a - b);
}

export function supportsAutoImages(platform: PlatformType) {
  return IMAGE_ENABLED_PLATFORMS.includes(platform);
}

export function planWechatImageSpecs(content: WechatContent, settings: AppSettings): ArticleImageSpec[] {
  if (!settings.imageGeneration.enabled) {
    return [];
  }

  const totalChars = content.sections.reduce((sum, section) => sum + section.body.length, content.summary.length);
  const desiredCount = totalChars < 700 ? 1 : totalChars < 1400 ? 2 : totalChars < 2200 ? 3 : 4;
  const additionalCount = Math.max(0, desiredCount - 1);
  const selectedIndexes = selectSectionIndexes(content.sections.length, additionalCount);

  const specs: ArticleImageSpec[] = [
    {
      id: createImageId("wechat-cover", 0),
      placement: "cover",
      purpose: "头图 / 封面图",
      prompt: buildFinalImagePrompt({
        semanticPrompt: `文章主题“${content.title}”，强调 ${summarizeText(content.summary || content.sections[0]?.body || content.title)}`,
        purpose: "头图 / 封面图",
        platform: "wechat",
        placement: "cover",
        settings,
      }),
      stylePreset: settings.imageGeneration.stylePreset,
      alt: `${content.title} 头图`,
      aspectRatio: getPlacementAspectRatio("wechat", "cover"),
      provider: "minimax",
      status: "planned",
    },
  ];

  selectedIndexes.forEach((sectionIndex, index) => {
    const section = content.sections[sectionIndex];
    const placement: ArticleImagePlacement = index % 2 === 0 ? "after_section" : "before_section";
    specs.push({
      id: createImageId("wechat-section", index),
      placement,
      relatedHeading: section.heading,
      purpose: section.heading ? `辅助说明章节“${section.heading}”` : "辅助说明正文核心观点",
      prompt: buildFinalImagePrompt({
        semanticPrompt: `围绕章节“${section.heading || `第${sectionIndex + 1}部分`}”，核心内容是 ${summarizeText(section.body)}`,
        purpose: section.heading ? `辅助说明章节“${section.heading}”` : "辅助说明正文核心观点",
        platform: "wechat",
        placement,
        settings,
      }),
      stylePreset: settings.imageGeneration.stylePreset,
      alt: `${section.heading || `第${sectionIndex + 1}部分`} 插图`,
      aspectRatio: getPlacementAspectRatio("wechat", placement),
      provider: "minimax",
      status: "planned",
    });
  });

  return specs;
}

export function buildWechatBlocks(content: WechatContent, imageSpecs: ArticleImageSpec[] = []): ArticleBlock[] {
  const blocks: ArticleBlock[] = [
    { type: "heading", level: 1, text: content.title },
  ];
  const coverImage = imageSpecs.find((spec) => spec.placement === "cover");
  if (coverImage) {
    blocks.push({ type: "image", imageId: coverImage.id, ...coverImage });
  }
  if (content.summary) {
    blocks.push({ type: "paragraph", text: content.summary });
  }

  const sectionImages = imageSpecs.filter((spec) => spec.placement !== "cover");

  content.sections.forEach((section, index) => {
    const matchingImages = sectionImages.filter((spec) => spec.relatedHeading === section.heading);
    matchingImages
      .filter((spec) => spec.placement === "before_section")
      .forEach((image) => blocks.push({ type: "image", imageId: image.id, ...image }));

    if (section.heading) {
      blocks.push({ type: "heading", level: 2, text: section.heading });
    }
    splitParagraphs(section.body).forEach((paragraph) => blocks.push({ type: "paragraph", text: paragraph }));

    if (section.quote) {
      blocks.push({ type: "quote", text: section.quote });
    }

    matchingImages
      .filter((spec) => spec.placement === "after_section" || spec.placement === "between_sections")
      .forEach((image) => blocks.push({ type: "image", imageId: image.id, ...image }));

    if (!section.heading && index === 0) {
      const introImage = sectionImages.find((spec) => spec.placement === "after_intro");
      if (introImage) {
        blocks.push({ type: "image", imageId: introImage.id, ...introImage });
      }
    }
  });

  blocks.push({ type: "cta", text: content.cta });
  return blocks;
}

export function planXiaohongshuImageSpecs(content: XiaohongshuContent, settings: AppSettings): ArticleImageSpec[] {
  if (!settings.imageGeneration.enabled) {
    return [];
  }

  const paragraphs = splitParagraphs(content.body);
  const desiredCount = paragraphs.length <= 2 ? 2 : paragraphs.length <= 4 ? 3 : 4;
  const additionalCount = Math.max(0, desiredCount - 1);
  const selectedIndexes = selectSectionIndexes(paragraphs.length, additionalCount);

  const specs: ArticleImageSpec[] = [
    {
      id: createImageId("xhs-cover", 0),
      placement: "cover",
      purpose: "小红书封面图",
      prompt: buildFinalImagePrompt({
        semanticPrompt: `小红书图文标题“${content.title}”，突出 ${summarizeText(paragraphs[0] || content.body || content.title)}`,
        purpose: "小红书封面图",
        platform: "xiaohongshu",
        placement: "cover",
        settings,
      }),
      stylePreset: settings.imageGeneration.stylePreset,
      alt: `${content.title} 封面图`,
      aspectRatio: getPlacementAspectRatio("xiaohongshu", "cover"),
      provider: "minimax",
      status: "planned",
    },
  ];

  selectedIndexes.forEach((paragraphIndex, index) => {
    const paragraph = paragraphs[paragraphIndex];
    specs.push({
      id: createImageId("xhs-body", index),
      placement: "between_sections",
      purpose: `补充说明第 ${paragraphIndex + 1} 段的核心信息`,
      prompt: buildFinalImagePrompt({
        semanticPrompt: `围绕正文段落“${summarizeText(paragraph)}”生成图文配图，贴近生活化分享语境`,
        purpose: `补充说明第 ${paragraphIndex + 1} 段的核心信息`,
        platform: "xiaohongshu",
        placement: "between_sections",
        settings,
      }),
      stylePreset: settings.imageGeneration.stylePreset,
      alt: `小红书正文配图 ${index + 1}`,
      aspectRatio: getPlacementAspectRatio("xiaohongshu", "between_sections"),
      provider: "minimax",
      status: "planned",
    });
  });

  return specs;
}

export function buildXiaohongshuBlocks(content: XiaohongshuContent, imageSpecs: ArticleImageSpec[] = []): ArticleBlock[] {
  const blocks: ArticleBlock[] = [
    { type: "heading", level: 1, text: content.title },
  ];
  const coverImage = imageSpecs.find((spec) => spec.placement === "cover");
  if (coverImage) {
    blocks.push({ type: "image", imageId: coverImage.id, ...coverImage });
  }

  const bodyImages = imageSpecs.filter((spec) => spec.placement !== "cover");
  const paragraphs = splitParagraphs(content.body);
  const insertionIndexes = selectSectionIndexes(paragraphs.length, bodyImages.length);

  paragraphs.forEach((paragraph, index) => {
    blocks.push({ type: "paragraph", text: paragraph });
    const imageIndex = insertionIndexes.indexOf(index);
    if (imageIndex !== -1 && bodyImages[imageIndex]) {
      const image = bodyImages[imageIndex];
      blocks.push({ type: "image", imageId: image.id, ...image });
    }
  });

  if (content.hashtags.length > 0) {
    blocks.push({ type: "list", ordered: false, items: content.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`) });
  }

  return blocks;
}

export function syncXiaohongshuImagesFromSpecs(imageSpecs: ArticleImageSpec[]) {
  return imageSpecs.map((spec) => ({
    id: spec.id,
    url: spec.url,
    placeholder: spec.purpose,
    caption: spec.alt,
    prompt: spec.prompt,
    status: spec.status,
    stylePreset: spec.stylePreset,
    aspectRatio: spec.aspectRatio,
    provider: spec.provider,
    error: spec.error,
    referenceImages: spec.referenceImages,
  }));
}

export async function renderArticleImages({
  taskId,
  platform,
  imageSpecs,
  settings,
}: {
  taskId: string;
  platform: PlatformType;
  imageSpecs: ArticleImageSpec[];
  settings: AppSettings;
}) {
  const rendered: ArticleImageSpec[] = [];

  for (const imageSpec of imageSpecs) {
    const generatingSpec: ArticleImageSpec = {
      ...imageSpec,
      status: "generating",
      provider: "minimax",
    };

    try {
      console.info("[image-generation] starting", {
        taskId,
        imageId: imageSpec.id,
        provider: "minimax",
        mode: imageSpec.referenceImages?.length ? "subject_reference" : "text_to_image",
        aspectRatio: imageSpec.aspectRatio,
        promptLength: imageSpec.prompt.length,
      });
      const asset = await generateMiniMaxImage({
        taskId,
        imageId: imageSpec.id,
        prompt: imageSpec.prompt,
        aspectRatio: imageSpec.aspectRatio || getPlacementAspectRatio(platform, imageSpec.placement),
        referenceImages: imageSpec.referenceImages,
      });

      rendered.push({
        ...generatingSpec,
        status: "ready",
        url: asset.url,
        providerAssetId: asset.providerAssetId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "MiniMax 图片生成失败";
      console.error("[image-generation] failed", {
        taskId,
        imageId: imageSpec.id,
        provider: "minimax",
        error: message,
      });
      rendered.push({
        ...generatingSpec,
        status: "failed",
        error: message,
      });
    }
  }

  return rendered;
}
