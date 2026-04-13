import type { ImageStylePreset } from "@/types/settings";

export type PlatformType = "wechat" | "xiaohongshu" | "twitter" | "video_script";

export type TwitterMode = "single" | "thread";

export type ArticleImagePlacement =
  | "cover"
  | "after_intro"
  | "between_sections"
  | "before_section"
  | "after_section";

export type ArticleImageStatus = "planned" | "generating" | "ready" | "failed";

export type ArticleImageSpec = {
  id: string;
  placement: ArticleImagePlacement;
  relatedHeading?: string;
  purpose: string;
  prompt: string;
  stylePreset?: ImageStylePreset;
  alt?: string;
  aspectRatio?: string;
  provider?: "minimax";
  status: ArticleImageStatus;
  url?: string;
  error?: string;
  referenceImages?: string[];
  providerAssetId?: string;
};

export type ArticleBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | ({
      type: "image";
      imageId: string;
    } & ArticleImageSpec)
  | { type: "cta"; text: string };

export type WechatContentSection = {
  heading?: string;
  body: string;
  quote?: string;
  imagePlaceholder?: string;
};

export type WechatContent = {
  title: string;
  summary: string;
  sections: WechatContentSection[];
  blocks?: ArticleBlock[];
  imageSpecs?: ArticleImageSpec[];
  cta: string;
};

export type XiaohongshuImage = {
  id: string;
  url?: string;
  placeholder?: string;
  caption?: string;
  prompt?: string;
  status?: ArticleImageStatus;
  stylePreset?: ImageStylePreset;
  aspectRatio?: string;
  provider?: "minimax";
  error?: string;
  referenceImages?: string[];
};

export type XiaohongshuContent = {
  images: XiaohongshuImage[];
  title: string;
  body: string;
  hashtags: string[];
  blocks?: ArticleBlock[];
  imageSpecs?: ArticleImageSpec[];
};

export type TwitterSingleContent = {
  mode: "single";
  text: string;
};

export type TwitterThreadTweet = {
  id: string;
  text: string;
};

export type TwitterThreadContent = {
  mode: "thread";
  tweets: TwitterThreadTweet[];
};

export type TwitterContent = TwitterSingleContent | TwitterThreadContent;

export type VideoScriptContent = {
  title: string;
  duration: string;
  hook: string;
  body: string;
  transition: string;
  endingCta: string;
  voiceoverNotes: string;
};

export type TaskContents = {
  wechat?: WechatContent;
  xiaohongshu?: XiaohongshuContent;
  twitter?: TwitterContent;
  video_script?: VideoScriptContent;
};
