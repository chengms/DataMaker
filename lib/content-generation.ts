import { generateWechatContent } from "@/lib/wechat-generator";
import { generateXiaohongshuContent } from "@/lib/xiaohongshu-generator";
import { generateTwitterContent } from "@/lib/twitter-generator";
import { generateVideoScriptContent } from "@/lib/video-script-generator";
import type { PlatformType, TaskContents } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

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
): Promise<TaskContents> {
  const entries = await Promise.all(
    input.selectedPlatforms.map(async (platform) => {
      const generator = GENERATORS[platform];
      const content = await generator(input, settings);
      return [platform, content] as const;
    }),
  );

  return Object.fromEntries(entries) as TaskContents;
}
