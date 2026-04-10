export type PlatformType = "wechat" | "xiaohongshu" | "twitter" | "video_script";

export type TwitterMode = "single" | "thread";

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
  cta: string;
};

export type XiaohongshuImage = {
  id: string;
  url?: string;
  placeholder?: string;
  caption?: string;
};

export type XiaohongshuContent = {
  images: XiaohongshuImage[];
  title: string;
  body: string;
  hashtags: string[];
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
