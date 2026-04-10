import { generateMockContents } from "@/lib/mockGenerators";
import { generateWechatContent } from "@/lib/wechat-generator";
import type { TaskContents } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

export async function generateTaskContents(
  input: TaskInput,
  settings: AppSettings,
): Promise<TaskContents> {
  const contents = generateMockContents(input);

  if (input.selectedPlatforms.includes("wechat")) {
    contents.wechat = await generateWechatContent(input, settings);
  }

  return contents;
}
