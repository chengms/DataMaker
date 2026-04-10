import type {
  PlatformType,
  TaskContents,
  TwitterContent,
  TwitterMode,
  VideoScriptContent,
  WechatContent,
  XiaohongshuContent,
} from "@/types/content";
import type { TaskInput } from "@/types/task";

function createWechatContent(input: TaskInput): WechatContent {
  return {
    title: `${input.topic}：一套适合${input.audience || "目标用户"}的公众号内容框架`,
    summary: `围绕“${input.topic}”快速搭建认知、方法和行动建议，适合${input.contentGoal || "内容触达与转化"}场景。`,
    sections: [
      {
        heading: "为什么这个话题现在值得做",
        body: `先从用户最直接的痛点切入：${input.topic} 不是一个孤立需求，而是和${input.materialNotes || "市场变化、用户预期和内容效率"}紧密相关。`,
        quote: "把问题说具体，用户才会继续读。",
      },
      {
        heading: "拆出一套可复用的方法",
        body: `建议从目标用户、内容角度、表达节奏三层来组织信息。语气上保持${input.tone || "专业且清晰"}，长度控制在${input.lengthHint || "中等偏长"}。`,
        imagePlaceholder: "图示占位：方法框架 / 对比图 / 流程图",
      },
      {
        heading: "落到可执行动作",
        body: `最后把抽象认知收束到执行建议，例如如何开始、如何验证、如何持续优化，确保内容不止停留在观点层。`,
      },
    ],
    cta: "如果你也在规划多平台内容矩阵，可以直接用这套结构开始下一篇。",
  };
}

function createXiaohongshuContent(input: TaskInput): XiaohongshuContent {
  return {
    images: Array.from({ length: 3 }).map((_, index) => ({
      id: crypto.randomUUID(),
      placeholder: `封面/配图占位 ${index + 1}`,
      caption: `和“${input.topic}”相关的视觉提示 ${index + 1}`,
    })),
    title: `${input.topic} 这件事，我建议你先这样做`,
    body: `最近我在反复整理“${input.topic}”这类内容，发现很多人不是不会做，而是一开始就把重点放错了。\n\n如果你的目标是${input.contentGoal || "提升内容表现"}，先别急着堆信息，先想清楚对象是谁：${input.audience || "真正会消费这条内容的人"}。\n\n然后把表达方式调成${input.tone || "更自然、更直接"}，把最想让人带走的一句话提前说出来。这样内容会更像经验分享，而不是说明书。`,
    hashtags: [
      input.topic.replace(/\s+/g, ""),
      "内容创作",
      "多平台运营",
      "效率提升",
    ],
  };
}

function createTwitterContent(input: TaskInput, mode: TwitterMode): TwitterContent {
  if (mode === "single") {
    return {
      mode: "single",
      text: `One brief for ${input.topic}, then repurpose it into platform-native outputs. Less rewriting, more leverage.`,
    };
  }

  return {
    mode: "thread",
    tweets: [
      {
        id: crypto.randomUUID(),
        text: `If you're creating around "${input.topic}", stop writing separately for every channel.`,
      },
      {
        id: crypto.randomUUID(),
        text: `Start with one core idea, then adapt the structure, hook, and CTA for each platform.`,
      },
      {
        id: crypto.randomUUID(),
        text: `WeChat wants depth. Xiaohongshu wants clarity + resonance. Twitter wants compression.`,
      },
      {
        id: crypto.randomUUID(),
        text: `A good content system is not just generation. It's editing, reuse, and fast publishing loops.`,
      },
    ],
  };
}

function createVideoScriptContent(input: TaskInput): VideoScriptContent {
  return {
    title: `${input.topic} 短视频脚本`,
    duration: input.lengthHint || "60-90 秒",
    hook: `如果你正在做${input.topic}，但总觉得内容效率很低，先别继续硬写。`,
    body: `大多数问题不在于不会创作，而在于没有先搭建一个可复用的主命题。先把主题、对象和目标统一，再按平台拆表达方式，效率会明显提升。`,
    transition: "接下来我直接拆成 3 个步骤给你看。",
    endingCta: "如果你想把同一个主题拆成多平台版本，下一条我继续讲具体结构。",
    voiceoverNotes: `语速稳一点，强调“统一输入”“多平台拆分”“继续编辑”三个关键词，整体保持${input.tone || "清晰干练"}。`,
  };
}

export function generateMockContents(input: TaskInput): TaskContents {
  return input.selectedPlatforms.reduce<TaskContents>((acc, platform) => {
    switch (platform) {
      case "wechat":
        acc.wechat = createWechatContent(input);
        break;
      case "xiaohongshu":
        acc.xiaohongshu = createXiaohongshuContent(input);
        break;
      case "twitter":
        acc.twitter = createTwitterContent(input, input.twitterMode || "single");
        break;
      case "video_script":
        acc.video_script = createVideoScriptContent(input);
        break;
      default: {
        const exhaustiveCheck: never = platform;
        throw new Error(`Unsupported platform: ${exhaustiveCheck satisfies PlatformType}`);
      }
    }
    return acc;
  }, {});
}

export function buildTaskTitle(input: TaskInput) {
  return input.topic.slice(0, 36);
}
