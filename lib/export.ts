import type { PlatformType, TaskContents } from "@/types/content";

function toText(platform: PlatformType, contents: TaskContents) {
  switch (platform) {
    case "wechat": {
      const content = contents.wechat;
      if (!content) return "";
      return [
        content.title,
        content.summary,
        ...content.sections.map((section) =>
          [section.heading, section.body, section.quote, section.imagePlaceholder]
            .filter(Boolean)
            .join("\n"),
        ),
        `CTA: ${content.cta}`,
      ].join("\n\n");
    }
    case "xiaohongshu": {
      const content = contents.xiaohongshu;
      if (!content) return "";
      return [
        content.title,
        content.body,
        `#${content.hashtags.join(" #")}`,
        ...content.images.map((image) => image.placeholder || image.url || "图片占位"),
      ].join("\n\n");
    }
    case "twitter": {
      const content = contents.twitter;
      if (!content) return "";
      return content.mode === "single"
        ? content.text
        : content.tweets.map((tweet, index) => `${index + 1}. ${tweet.text}`).join("\n\n");
    }
    case "video_script": {
      const content = contents.video_script;
      if (!content) return "";
      return [
        content.title,
        `时长: ${content.duration}`,
        `Hook: ${content.hook}`,
        content.body,
        `Transition: ${content.transition}`,
        `CTA: ${content.endingCta}`,
        `Voiceover: ${content.voiceoverNotes}`,
      ].join("\n\n");
    }
  }
}

export function getPlatformExportData(platform: PlatformType, contents: TaskContents) {
  return {
    txt: toText(platform, contents),
    json: JSON.stringify(contents[platform], null, 2),
  };
}
