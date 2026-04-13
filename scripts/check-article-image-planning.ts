import { strict as assert } from "node:assert";

import {
  buildWechatBlocks,
  buildXiaohongshuBlocks,
  planWechatImageSpecs,
  planXiaohongshuImageSpecs,
} from "@/lib/article-images";
import { getDefaultSettings } from "@/lib/settings-service";
import type { WechatContent, XiaohongshuContent } from "@/types/content";

const enabledSettings = getDefaultSettings();
const disabledSettings = {
  ...enabledSettings,
  imageGeneration: {
    ...enabledSettings.imageGeneration,
    enabled: false,
  },
};

const wechatContent: WechatContent = {
  title: "AI 自动化如何真正落地",
  summary: "一篇关于 AI 自动化落地方法、案例和推进顺序的公众号文章。",
  sections: [
    { heading: "为什么现在要做", body: "团队开始接触 AI 工具后，最常见的问题不是不会用，而是不知道从哪里开始。" },
    { heading: "怎么拆目标", body: "先从固定流程入手，再拆成可以持续复用的任务链路，最后才是提效和规模化。" },
    { heading: "如何验证", body: "看是否真的缩短交付周期、减少重复劳动，并让团队复盘更顺畅。" },
  ],
  cta: "如果你也在搭建 AI 工作流，可以从最小闭环开始。",
};

const xiaohongshuContent: XiaohongshuContent = {
  title: "AI 内容工作流别再瞎试了",
  body: "第一步先别急着上很多工具，先找一个重复出现的固定场景。\n\n第二步，把场景拆成几个清晰动作，每个动作只解决一个问题。\n\n第三步，再考虑如何把这个流程交给 AI 和自动化。",
  hashtags: ["AI工作流", "内容运营", "效率提升"],
  images: [],
};

const wechatImageSpecs = planWechatImageSpecs(wechatContent, enabledSettings);
const wechatBlocks = buildWechatBlocks(wechatContent, wechatImageSpecs);
assert.equal(wechatImageSpecs.length >= 1, true, "WeChat content should plan at least one image when enabled.");
assert.equal(
  wechatBlocks.some((block) => block.type === "image"),
  true,
  "WeChat blocks should include image blocks when image generation is enabled.",
);

const xiaohongshuImageSpecs = planXiaohongshuImageSpecs(xiaohongshuContent, enabledSettings);
const xiaohongshuBlocks = buildXiaohongshuBlocks(xiaohongshuContent, xiaohongshuImageSpecs);
assert.equal(
  xiaohongshuBlocks.some((block) => block.type === "image"),
  true,
  "Xiaohongshu blocks should include image blocks when image generation is enabled.",
);

const disabledWechatSpecs = planWechatImageSpecs(wechatContent, disabledSettings);
assert.equal(
  disabledWechatSpecs.length,
  0,
  "WeChat should skip image planning when auto image generation is disabled.",
);

console.log("Article image planning behavior is correct.");
