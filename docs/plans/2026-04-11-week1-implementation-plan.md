# Week 1 Core Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the highest-priority Week 1 work by making generation behavior consistent across platforms, preventing publish/save state drift, and aligning product copy with actual capabilities.

**Architecture:** Keep the current Next.js App Router + Prisma structure intact, but replace the single special-case generation path with per-platform generators behind one orchestration function. Reuse the existing OpenAI-compatible client and existing editor schemas so the UI does not need structural rewrites in this phase.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, Zod, SQLite

---

## File Structure

### Existing files to modify

- [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:1)
  Orchestrates multi-platform content generation.
- [lib/wechat-generator.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/wechat-generator.ts:1)
  Existing reference implementation for real model-backed generation.
- [lib/openai-compatible.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/openai-compatible.ts:1)
  Shared OpenAI-compatible completion client.
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:1)
  Save, publish, and task sync behavior.
- [components/settings/ProviderSettingsForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/ProviderSettingsForm.tsx:1)
  Provider-level capability messaging.
- [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:1)
  Platform prompt capability messaging.
- [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:1)
  Product capability documentation.

### New files to create

- `lib/xiaohongshu-generator.ts`
  Real generation and schema validation for Xiaohongshu content.
- `lib/twitter-generator.ts`
  Real generation and schema validation for Twitter single/thread content.
- `lib/video-script-generator.ts`
  Real generation and schema validation for video script content.

---

### Task 1: Refactor the generation entrypoint to use per-platform generators

**Files:**
- Modify: [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:1)
- Modify: [lib/mockGenerators.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/mockGenerators.ts:1)
- Modify: [lib/wechat-generator.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/wechat-generator.ts:1)
- Create: `lib/xiaohongshu-generator.ts`
- Create: `lib/twitter-generator.ts`
- Create: `lib/video-script-generator.ts`

- [ ] **Step 1: Create a shared generation contract in the orchestration layer**

Add imports and a generator map to [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:1):

```ts
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
```

- [ ] **Step 2: Replace the mock-first implementation**

Replace the body of `generateTaskContents` in [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:7) with:

```ts
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
```

- [ ] **Step 3: Keep mock generators for future fallback use**

Do not remove the helper content builders from [lib/mockGenerators.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/mockGenerators.ts:1), but rename the exported top-level function if needed so it no longer reads like the primary production path. If you rename it, use:

```ts
export function generateFallbackContents(input: TaskInput): TaskContents {
  // existing implementation body
}
```

- [ ] **Step 4: Run typecheck after the orchestration refactor**

Run: `npm run typecheck`

Expected: `tsc --noEmit` completes without import or type errors.

- [ ] **Step 5: Commit the orchestration change**

```bash
git add lib/content-generation.ts lib/mockGenerators.ts lib/wechat-generator.ts lib/xiaohongshu-generator.ts lib/twitter-generator.ts lib/video-script-generator.ts
git commit -m "refactor: use per-platform content generators"
```

### Task 2: Add Xiaohongshu real generation

**Files:**
- Create: `lib/xiaohongshu-generator.ts`
- Modify: [types/content.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/types/content.ts:1)

- [ ] **Step 1: Create the Xiaohongshu schema and parser**

Create `lib/xiaohongshu-generator.ts` with:

```ts
import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { XiaohongshuContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const xiaohongshuContentSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        placeholder: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1)
    .max(9),
  title: z.string().min(1),
  body: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(1),
});

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}
```

- [ ] **Step 2: Add the Xiaohongshu prompt builder**

Append to `lib/xiaohongshu-generator.ts`:

```ts
function buildXiaohongshuPrompt(input: TaskInput, settings: AppSettings) {
  return [
    "请根据下面的创作需求，输出一篇适合小红书发布的图文内容。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        images: [{ id: "string", placeholder: "string", caption: "string" }],
        title: "string",
        body: "string",
        hashtags: ["string"],
      },
      null,
      2,
    ),
    "写作要求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.xiaohongshu.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.xiaohongshu.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.xiaohongshu.extraRules || "无"}`,
    "- images 返回 3 张图片建议，每张图片给出唯一 id、占位说明和图片 caption。",
    "- body 写成适合小红书阅读的自然分段，不要只写提纲。",
    "- hashtags 返回 3 到 6 个，不要带 # 前缀。",
  ].join("\n");
}
```

- [ ] **Step 3: Add the generator function**

Append to `lib/xiaohongshu-generator.ts`:

```ts
export async function generateXiaohongshuContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<XiaohongshuContent> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: settings.xiaohongshu.systemPrompt,
    },
    {
      role: "user",
      content: buildXiaohongshuPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return xiaohongshuContentSchema.parse(parsed);
}
```

- [ ] **Step 4: Run typecheck for the new module**

Run: `npm run typecheck`

Expected: the new Xiaohongshu generator compiles cleanly.

- [ ] **Step 5: Commit the Xiaohongshu generator**

```bash
git add lib/xiaohongshu-generator.ts
git commit -m "feat: add xiaohongshu model generator"
```

### Task 3: Add Twitter real generation

**Files:**
- Create: `lib/twitter-generator.ts`

- [ ] **Step 1: Create separate schemas for single and thread**

Create `lib/twitter-generator.ts` with:

```ts
import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { TwitterContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const twitterSingleSchema = z.object({
  mode: z.literal("single"),
  text: z.string().min(1).max(280),
});

const twitterThreadSchema = z.object({
  mode: z.literal("thread"),
  tweets: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(280),
      }),
    )
    .min(2)
    .max(6),
});

const twitterContentSchema = z.union([twitterSingleSchema, twitterThreadSchema]);
```

- [ ] **Step 2: Add the prompt builder**

Append to `lib/twitter-generator.ts`:

```ts
function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}

function buildTwitterPrompt(input: TaskInput, settings: AppSettings) {
  const mode = input.twitterMode || "single";

  return [
    "请根据下面的创作需求，输出适合 Twitter/X 发布的内容。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    `输出模式必须是：${mode}`,
    "当 mode 为 single 时，JSON 结构必须是：",
    JSON.stringify({ mode: "single", text: "string" }, null, 2),
    "当 mode 为 thread 时，JSON 结构必须是：",
    JSON.stringify({ mode: "thread", tweets: [{ id: "string", text: "string" }] }, null, 2),
    "写作要求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.twitter.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.twitter.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.twitter.extraRules || "无"}`,
    "- 每条 tweet 都要独立可读。",
    "- 不要使用 markdown 列表。",
    "- 不要超过 280 个字符。",
  ].join("\n");
}
```

- [ ] **Step 3: Add the generator function**

Append to `lib/twitter-generator.ts`:

```ts
export async function generateTwitterContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<TwitterContent> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: settings.twitter.systemPrompt,
    },
    {
      role: "user",
      content: buildTwitterPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return twitterContentSchema.parse(parsed);
}
```

- [ ] **Step 4: Run typecheck after adding Twitter generation**

Run: `npm run typecheck`

Expected: the new Twitter generator compiles and matches `TwitterContent`.

- [ ] **Step 5: Commit the Twitter generator**

```bash
git add lib/twitter-generator.ts
git commit -m "feat: add twitter model generator"
```

### Task 4: Add video script real generation

**Files:**
- Create: `lib/video-script-generator.ts`

- [ ] **Step 1: Create the schema and parser**

Create `lib/video-script-generator.ts` with:

```ts
import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { VideoScriptContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const videoScriptContentSchema = z.object({
  title: z.string().min(1),
  duration: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  transition: z.string().min(1),
  endingCta: z.string().min(1),
  voiceoverNotes: z.string().min(1),
});

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}
```

- [ ] **Step 2: Add the prompt builder**

Append to `lib/video-script-generator.ts`:

```ts
function buildVideoScriptPrompt(input: TaskInput, settings: AppSettings) {
  return [
    "请根据下面的创作需求，输出一个适合短视频口播的脚本。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        title: "string",
        duration: "string",
        hook: "string",
        body: "string",
        transition: "string",
        endingCta: "string",
        voiceoverNotes: "string",
      },
      null,
      2,
    ),
    "写作要求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.video_script.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.video_script.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.video_script.extraRules || "无"}`,
    "- hook 必须适合前三秒表达。",
    "- body 直接输出口播内容，不要写分镜编号。",
    "- voiceoverNotes 说明语速、强调点或表演提示。",
  ].join("\n");
}
```

- [ ] **Step 3: Add the generator function**

Append to `lib/video-script-generator.ts`:

```ts
export async function generateVideoScriptContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<VideoScriptContent> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: settings.video_script.systemPrompt,
    },
    {
      role: "user",
      content: buildVideoScriptPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return videoScriptContentSchema.parse(parsed);
}
```

- [ ] **Step 4: Run typecheck after adding video script generation**

Run: `npm run typecheck`

Expected: the video script generator compiles and matches `VideoScriptContent`.

- [ ] **Step 5: Commit the video script generator**

```bash
git add lib/video-script-generator.ts
git commit -m "feat: add video script model generator"
```

### Task 5: Save before mock publish

**Files:**
- Modify: [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:1)

- [ ] **Step 1: Make `saveTask` report success or failure**

Change the signature in [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:98) from:

```ts
async (showToast = false) => {
```

to:

```ts
async (showToast = false): Promise<boolean> => {
```

and add explicit returns:

```ts
if (!task) return true;
```

Inside the success path:

```ts
return true;
```

Inside the catch block:

```ts
return false;
```

- [ ] **Step 2: Add a helper that ensures the current task is saved**

Inside [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:183), add:

```ts
async function ensureTaskSaved() {
  if (!isEditing && saveState !== "error") {
    return true;
  }

  return saveTask(true);
}
```

- [ ] **Step 3: Gate mock publish on save success**

Replace `handleMockPublish` in [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:208) with:

```ts
async function handleMockPublish() {
  setIsPublishing(true);

  try {
    const saved = await ensureTaskSaved();
    if (!saved) {
      toast.error("发布前保存失败，请先处理保存错误");
      return;
    }

    const response = await fetch(`/api/tasks/${displayTask.id}/mock-publish`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("模拟发布失败");
    }

    const task: Task = await response.json();
    updateHistoryTask(task);
    toast.success("模拟发布完成");
  } catch (error) {
    console.error(error);
    toast.error("模拟发布失败");
  } finally {
    setIsPublishing(false);
  }
}
```

- [ ] **Step 4: Run typecheck after the save/publish change**

Run: `npm run typecheck`

Expected: `WorkspaceShell` compiles with the new `Promise<boolean>` save flow.

- [ ] **Step 5: Commit the publish safety change**

```bash
git add components/workspace/WorkspaceShell.tsx
git commit -m "fix: save task before mock publish"
```

### Task 6: Align settings and README copy with actual capabilities

**Files:**
- Modify: [components/settings/ProviderSettingsForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/ProviderSettingsForm.tsx:1)
- Modify: [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:1)
- Modify: [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:1)

- [ ] **Step 1: Update provider copy to remove stale capability language**

Replace the read-only `Textarea` value in [components/settings/ProviderSettingsForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/ProviderSettingsForm.tsx:99) with:

```ts
value="当前任务创建时，已启用的平台都会优先使用这里配置的兼容 OpenAI 模型服务进行内容生成。各平台的 Prompt 和附加规则会共同影响生成结果。"
```

- [ ] **Step 2: Add capability guidance to the platform settings form**

Under the heading block in [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:45), insert:

```tsx
<p className="mt-2 text-sm text-muted-foreground">
  这里的 System Prompt、默认语气、默认长度和附加规则会参与当前平台的生成过程。
</p>
```

- [ ] **Step 3: Update README capability bullets**

Replace the `已实现能力` section in [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:35) with:

```md
## 已实现能力

- 统一输入创建任务
- 多平台内容生成
- 公众号 / 小红书 / Twitter / 视频脚本独立编辑器
- 历史任务侧边栏
- 任务保存与模拟发布
- 平台级 Prompt 设置持久化并参与生成
- 当前平台复制与导出 TXT / JSON
```
```

- [ ] **Step 4: Add a capability boundary note in README**

Under the `已实现能力` section in [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:43), add:

```md
## 当前边界

- V1 的“发布”仍然是模拟发布，不会调用真实平台 API。
- 小红书图片区当前以图片占位和文案管理为主，尚未接入正式图片存储方案。
```
```

- [ ] **Step 5: Run typecheck after the copy updates**

Run: `npm run typecheck`

Expected: documentation and UI text changes do not affect compilation.

- [ ] **Step 6: Commit the copy alignment**

```bash
git add components/settings/ProviderSettingsForm.tsx components/settings/PlatformPromptForm.tsx README.md
git commit -m "docs: align product copy with generation behavior"
```

### Task 7: Final Week 1 verification

**Files:**
- Modify: none

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 3: Smoke test core flows manually**

Run:

```bash
npm run dev
```

Expected manual checks:

- Create a task with `wechat + xiaohongshu`
- Verify both platforms return generated content
- Edit any field and immediately click `模拟发布`
- Refresh the task page and confirm the latest edit persisted
- Open `/settings`, change a platform rule, create a new task, confirm output changes

- [ ] **Step 4: Commit the verification checkpoint**

```bash
git add .
git commit -m "chore: verify week 1 reliability improvements"
```

## Self-Review

### Spec coverage

- Week 1 plan covers multi-platform real generation, save-before-publish, and product copy alignment.
- Testing framework introduction remains scheduled for Week 2, matching the broader execution plan rather than this Week 1 implementation slice.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain in this plan.

### Type consistency

- `generateXiaohongshuContent`, `generateTwitterContent`, and `generateVideoScriptContent` match the generator names used in `lib/content-generation.ts`.
- Save/publish flow consistently uses `Promise<boolean>` for `saveTask`.

## Execution Handoff

Plan complete and saved to `docs/plans/2026-04-11-week1-implementation-plan.md`.

Recommended next action in this session:

1. Implement Task 5 first because it is low-risk, high-value, and does not depend on the generator refactor.
2. Then implement Tasks 1-4 in order.
3. After that, move into Week 2 testing work.
