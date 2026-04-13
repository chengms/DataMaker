import { generateWechatContent } from "@/lib/wechat-generator";
import { generateXiaohongshuContent } from "@/lib/xiaohongshu-generator";
import { generateTwitterContent } from "@/lib/twitter-generator";
import { generateVideoScriptContent } from "@/lib/video-script-generator";
import { executeTaskGenerationPlan } from "@/lib/task-execution";
import type { PlatformType, TaskContents } from "@/types/content";
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
  onProgress?: (execution: TaskExecution, contents: TaskContents) => Promise<void> | void,
) {
  return executeTaskGenerationPlan(
    input,
    async (subTask: SubTask) => {
      if (!subTask.platform) {
        throw new Error("子任务缺少平台信息");
      }

      const generator = GENERATORS[subTask.platform];
      console.info("[content-generation] generating platform", {
        platform: subTask.platform,
        subTaskId: subTask.id,
      });
      const content = await generator(input, settings);

      return {
        platform: subTask.platform,
        content,
        result: `${subTask.title}已完成`,
      };
    },
    onProgress,
  ) as Promise<{
    contents: TaskContents;
    execution: TaskExecution;
  }>;
}
