import {
  buildWechatBlocks,
  buildXiaohongshuBlocks,
  planWechatImageSpecs,
  planXiaohongshuImageSpecs,
  renderArticleImages,
  supportsAutoImages,
  syncXiaohongshuImagesFromSpecs,
} from "@/lib/article-images";
import { generateWechatContent } from "@/lib/wechat-generator";
import { generateXiaohongshuContent } from "@/lib/xiaohongshu-generator";
import { generateTwitterContent } from "@/lib/twitter-generator";
import { generateVideoScriptContent } from "@/lib/video-script-generator";
import { executeTaskGenerationPlan } from "@/lib/task-execution";
import type { PlatformType, TaskContents, WechatContent, XiaohongshuContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { SubTask, TaskExecution, TaskInput } from "@/types/task";

type PlatformGenerator = (
  input: TaskInput,
  settings: AppSettings,
) => Promise<TaskContents[PlatformType]>;

const GENERATORS: Record<PlatformType, PlatformGenerator> = {
  wechat: generateWechatContent,
  xiaohongshu: generateXiaohongshuContent,
  twitter: generateTwitterContent,
  video_script: generateVideoScriptContent,
};

export async function generateTaskContents(
  input: TaskInput,
  settings: AppSettings,
  taskId: string,
  onProgress?: (execution: TaskExecution, contents: TaskContents) => Promise<void> | void,
) {
  return executeTaskGenerationPlan(
    input,
    settings,
    async (subTask: SubTask, context) => {
      if (!subTask.platform) {
        throw new Error("子任务缺少平台信息");
      }

      const platform = subTask.platform;
      const generator = GENERATORS[platform];

      if (subTask.kind === "generate_text") {
        console.info("[content-generation] generating platform", {
          platform,
          subTaskId: subTask.id,
        });
        const content = await generator(input, settings);
        return {
          platform,
          content: withBaseBlocks(platform, content),
          result: `${subTask.title}已完成`,
        };
      }

      if (subTask.kind === "plan_images") {
        const existingContent = context.contents[platform];
        if (!existingContent || !supportsAutoImages(platform)) {
          throw new Error(`${platform} 当前没有可规划图片的正文内容`);
        }

        if (platform === "wechat") {
          const wechat = existingContent as WechatContent;
          const imageSpecs = planWechatImageSpecs(wechat, settings);
          return {
            platform,
            content: {
              ...wechat,
              imageSpecs,
              blocks: buildWechatBlocks(wechat, imageSpecs),
            },
            result: `已为公众号规划 ${imageSpecs.length} 张图片`,
          };
        }

        if (platform === "xiaohongshu") {
          const xiaohongshu = existingContent as XiaohongshuContent;
          const imageSpecs = planXiaohongshuImageSpecs(xiaohongshu, settings);
          return {
            platform,
            content: {
              ...xiaohongshu,
              imageSpecs,
              images: syncXiaohongshuImagesFromSpecs(imageSpecs),
              blocks: buildXiaohongshuBlocks(xiaohongshu, imageSpecs),
            },
            result: `已为小红书规划 ${imageSpecs.length} 张图片`,
          };
        }
      }

      if (subTask.kind === "generate_images") {
        const existingContent = context.contents[platform];
        if (!existingContent || !supportsAutoImages(platform)) {
          throw new Error(`${platform} 当前没有可生成的图片块`);
        }

        if (platform === "wechat") {
          const wechat = existingContent as WechatContent;
          const renderedSpecs = await renderArticleImages({
            taskId,
            platform,
            imageSpecs: wechat.imageSpecs || [],
            settings,
          });
          const readyCount = renderedSpecs.filter((spec) => spec.status === "ready").length;
          const failedCount = renderedSpecs.filter((spec) => spec.status === "failed").length;
          return {
            platform,
            content: {
              ...wechat,
              imageSpecs: renderedSpecs,
              blocks: buildWechatBlocks(wechat, renderedSpecs),
            },
            result: `公众号图片生成完成：${readyCount} 张成功，${failedCount} 张失败`,
          };
        }

        if (platform === "xiaohongshu") {
          const xiaohongshu = existingContent as XiaohongshuContent;
          const renderedSpecs = await renderArticleImages({
            taskId,
            platform,
            imageSpecs: xiaohongshu.imageSpecs || [],
            settings,
          });
          const readyCount = renderedSpecs.filter((spec) => spec.status === "ready").length;
          const failedCount = renderedSpecs.filter((spec) => spec.status === "failed").length;
          return {
            platform,
            content: {
              ...xiaohongshu,
              imageSpecs: renderedSpecs,
              images: syncXiaohongshuImagesFromSpecs(renderedSpecs),
              blocks: buildXiaohongshuBlocks(xiaohongshu, renderedSpecs),
            },
            result: `小红书图片生成完成：${readyCount} 张成功，${failedCount} 张失败`,
          };
        }
      }

      throw new Error(`未支持的子任务类型: ${subTask.kind || "unknown"}`);
    },
    onProgress,
  ) as Promise<{
    contents: TaskContents;
    execution: TaskExecution;
  }>;
}

function withBaseBlocks(platform: PlatformType, content: TaskContents[PlatformType]) {
  if (platform === "wechat") {
    const wechat = content as WechatContent;
    return {
      ...wechat,
      imageSpecs: wechat.imageSpecs || [],
      blocks: buildWechatBlocks(wechat, wechat.imageSpecs || []),
    } as TaskContents[PlatformType];
  }

  if (platform === "xiaohongshu") {
    const xiaohongshu = content as XiaohongshuContent;
    return {
      ...xiaohongshu,
      imageSpecs: xiaohongshu.imageSpecs || [],
      blocks: buildXiaohongshuBlocks(xiaohongshu, xiaohongshu.imageSpecs || []),
    } as TaskContents[PlatformType];
  }

  return content;
}
