"use client";

import { useMemo, useState } from "react";
import {
  BookOpenText,
  Clapperboard,
  Copy,
  ExternalLink,
  FileText,
  MessageCircleMore,
  Sparkles,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { getPlatformSourceText } from "@/lib/workbench";
import type {
  PlatformType,
  TaskContents,
  TwitterThreadTweet,
  VideoScriptContent,
  WechatContentSection,
  XiaohongshuImage,
} from "@/types/content";
import type { Task } from "@/types/task";

type WorkspacePreviewContentProps = {
  task: Task;
  activePlatform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
  onExpand: () => void;
  mode?: "panel" | "dialog";
};

export function WorkspacePreviewContent({
  task,
  activePlatform,
  onPlatformChange,
  onExpand,
  mode = "panel",
}: WorkspacePreviewContentProps) {
  const isDialog = mode === "dialog";
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const sourceText = useMemo(() => getPlatformSourceText(task, activePlatform), [activePlatform, task]);

  function handleCopy() {
    navigator.clipboard.writeText(sourceText).then(
      () => toast.success("已复制当前平台原文"),
      () => toast.error("复制失败"),
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border border-white/80 bg-white/82 shadow-panel backdrop-blur",
        isDialog ? "flex h-full flex-col" : "",
      )}
    >
      <div className="border-b border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,248,252,0.9))] px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                <Sparkles className="size-3.5" />
                Preview Workspace
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{PLATFORM_LABELS[activePlatform]} 预览区</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  右侧面板强调真实发布效果，同时支持在原文与结构化预览之间切换。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setViewMode(viewMode === "preview" ? "source" : "preview")}>
                <FileText className="size-4" />
                {viewMode === "preview" ? "原文" : "预览"}
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="size-4" />
                复制
              </Button>
              {isDialog ? (
                <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.18em]">
                  全屏预览中
                </Badge>
              ) : (
                <Button variant="outline" onClick={onExpand}>
                  <ExternalLink className="size-4" />
                  展开预览
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={activePlatform} onValueChange={(next) => onPlatformChange(next as PlatformType)}>
              <TabsList className="bg-slate-100/90">
                {task.selectedPlatforms.map((platform) => (
                  <TabsTrigger key={platform} value={platform} className="min-w-[88px]">
                    {PLATFORM_LABELS[platform]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs value={viewMode} onValueChange={(next) => setViewMode(next as "preview" | "source")}>
              <TabsList className="bg-slate-100/90">
                <TabsTrigger value="preview">预览</TabsTrigger>
                <TabsTrigger value="source">原文</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_28%),linear-gradient(to_bottom,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] p-4",
          isDialog ? "flex-1 overflow-auto p-6" : "",
        )}
      >
        {viewMode === "source" ? (
          <SourceTextView platform={activePlatform} text={sourceText} task={task} />
        ) : (
          <PreviewStage task={task} platform={activePlatform} contents={task.contents} />
        )}
      </div>
    </div>
  );
}

function SourceTextView({
  platform,
  text,
  task,
}: {
  platform: PlatformType;
  text: string;
  task: Task;
}) {
  if (task.status === "generating") {
    return <PreviewEmptyState platform={platform} status={task.status} />;
  }

  return (
    <div className="mx-auto max-w-[760px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">原文</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{PLATFORM_LABELS[platform]} 内容源文本</h3>
      </div>
      <div className="px-6 py-6">
        <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {text || "当前平台尚未生成原文内容。"}
        </pre>
      </div>
    </div>
  );
}

function PreviewStage({
  task,
  platform,
  contents,
}: {
  task: Task;
  platform: PlatformType;
  contents: TaskContents;
}) {
  if (task.status === "generating") {
    return <PreviewEmptyState platform={platform} status={task.status} />;
  }

  switch (platform) {
    case "wechat":
      return contents.wechat ? <WechatPreview content={contents.wechat} /> : <PreviewEmptyState platform={platform} status={task.status} />;
    case "xiaohongshu":
      return contents.xiaohongshu ? (
        <XiaohongshuPreview content={contents.xiaohongshu} />
      ) : (
        <PreviewEmptyState platform={platform} status={task.status} />
      );
    case "twitter":
      return contents.twitter ? <TwitterPreview content={contents.twitter} /> : <PreviewEmptyState platform={platform} status={task.status} />;
    case "video_script":
      return contents.video_script ? (
        <VideoScriptPreview content={contents.video_script} />
      ) : (
        <PreviewEmptyState platform={platform} status={task.status} />
      );
    default:
      return <PreviewEmptyState platform={platform} status={task.status} />;
  }
}

function PreviewEmptyState({
  platform,
  status,
}: {
  platform: PlatformType;
  status: Task["status"];
}) {
  const isGenerating = status === "generating";

  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/75 px-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="max-w-sm space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
          {isGenerating ? <Sparkles className="size-6 animate-pulse" /> : <Sparkles className="size-6" />}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {isGenerating ? `${PLATFORM_LABELS[platform]} 正在生成中` : `${PLATFORM_LABELS[platform]} 预览暂未就绪`}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isGenerating
              ? "工作台已经收到任务上下文，AI 生成结果完成后会自动同步到这个预览区域。"
              : "该平台内容尚未生成，请先生成内容或在编辑区补充对应平台素材。"}
          </p>
        </div>
      </div>
    </div>
  );
}

function DeviceFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[760px] rounded-[32px] border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function WechatPreview({ content }: { content: TaskContents["wechat"] }) {
  if (!content) return null;

  return (
    <DeviceFrame className="overflow-hidden">
      <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#f8fffb,#f3fbf7)] px-8 py-7">
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-50 text-emerald-700">公众号文章</Badge>
          <BookOpenText className="size-4 text-emerald-500" />
        </div>
        <h3 className="mt-4 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-slate-950">
          {content.title || "请输入标题"}
        </h3>
        {content.summary ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{content.summary}</p>
        ) : null}
      </div>

      <div className="space-y-10 px-8 py-8">
        {content.sections.map((section, index) => (
          <WechatSection key={`${section.heading}-${index}`} section={section} index={index} />
        ))}

        {content.cta ? (
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">CTA</p>
            <p className="mt-3 text-base leading-7 text-slate-700">{content.cta}</p>
          </div>
        ) : null}
      </div>
    </DeviceFrame>
  );
}

function WechatSection({ section, index }: { section: WechatContentSection; index: number }) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
          {index + 1}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent" />
      </div>

      {section.heading ? <h4 className="text-2xl font-semibold leading-tight text-slate-900">{section.heading}</h4> : null}

      <div className="space-y-4 text-[15px] leading-8 text-slate-700">
        {splitParagraphs(section.body).map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>{paragraph}</p>
        ))}
      </div>

      {section.quote ? (
        <blockquote className="rounded-[24px] border-l-4 border-emerald-500 bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700">
          {section.quote}
        </blockquote>
      ) : null}

      {section.imagePlaceholder ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(203,213,225,0.35),rgba(248,250,252,0.9))]">
          <div className="flex min-h-[220px] items-center justify-center px-8 py-10 text-center text-sm leading-6 text-slate-500">
            {section.imagePlaceholder}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function XiaohongshuPreview({ content }: { content: TaskContents["xiaohongshu"] }) {
  if (!content) return null;

  const tags = normalizeHashtags(content.hashtags);

  return (
    <DeviceFrame className="max-w-[420px] overflow-hidden bg-[#fffaf6]">
      <div className="border-b border-rose-100 bg-[linear-gradient(180deg,#fff8f4,#fffdfb)] px-5 py-5">
        <div className="flex items-center justify-between">
          <Badge className="bg-rose-100 text-rose-700">小红书笔记</Badge>
          <MessageCircleMore className="size-4 text-rose-400" />
        </div>
        <div className="mt-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#ffede2,#fff8f5)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Cover Idea</p>
          <h3 className="mt-3 text-2xl font-semibold leading-snug text-slate-900">{content.title || "标题封面"}</h3>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          {content.images.length > 0 ? (
            content.images.slice(0, 4).map((image, index) => (
              <XiaohongshuImageCard key={image.id || index} image={image} index={index} />
            ))
          ) : (
            <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-[28px] border border-dashed border-rose-200 bg-white text-sm text-rose-400">
              预留封面 / 图片区
            </div>
          )}
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(244,114,182,0.08)]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-rose-500">Note</p>
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700">
            {splitParagraphs(content.body).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {tags.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 rounded-[22px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
            留言区引导：欢迎补充你的经验、案例或者踩坑感受。
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
}

function XiaohongshuImageCard({ image, index }: { image: XiaohongshuImage; index: number }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-[0_12px_30px_rgba(244,114,182,0.06)]">
      <div className="flex aspect-square items-center justify-center bg-[linear-gradient(135deg,#ffe9e0,#fff7f3)] px-4 text-center text-sm leading-6 text-slate-500">
        {image.placeholder || image.url || `图片 ${index + 1}`}
      </div>
      {image.caption ? <div className="px-3 py-2 text-xs leading-5 text-slate-500">{image.caption}</div> : null}
    </div>
  );
}

function TwitterPreview({ content }: { content: TaskContents["twitter"] }) {
  if (!content) return null;

  return (
    <DeviceFrame className="max-w-[560px] overflow-hidden border-slate-200 bg-[#f7fbff]">
      <div className="border-b border-sky-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              DM
            </div>
            <div>
              <p className="font-semibold text-slate-900">DataMaker Studio</p>
              <p className="text-sm text-slate-500">@datamaker_studio</p>
            </div>
          </div>
          <Badge className="bg-sky-50 text-sky-700">Twitter Preview</Badge>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {content.mode === "single" ? (
          <TweetCard text={content.text} />
        ) : (
          content.tweets.map((tweet, index) => <ThreadTweetCard key={tweet.id} tweet={tweet} index={index} />)
        )}
      </div>
    </DeviceFrame>
  );
}

function TweetCard({ text }: { text: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_32px_rgba(14,165,233,0.08)]">
      <div className="space-y-4">
        <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{text || "请输入推文内容"}</div>
        <div className="flex items-center gap-5 text-sm text-slate-400">
          <span>回复</span>
          <span>转发</span>
          <span>喜欢</span>
          <span>分享</span>
        </div>
      </div>
    </div>
  );
}

function ThreadTweetCard({ tweet, index }: { tweet: TwitterThreadTweet; index: number }) {
  return (
    <div className="relative rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_32px_rgba(14,165,233,0.06)]">
      {index > 0 ? <div className="absolute -top-3 left-9 h-3 w-px bg-sky-200" /> : null}
      <div className="flex items-start gap-4">
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">@datamaker_studio</span>
            <span>·</span>
            <span>Thread</span>
          </div>
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
            {tweet.text || `Thread 第 ${index + 1} 条内容`}
          </div>
          <div className="mt-4 flex items-center gap-5 text-sm text-slate-400">
            <span>回复</span>
            <span>转发</span>
            <span>喜欢</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoScriptPreview({ content }: { content: TaskContents["video_script"] }) {
  if (!content) return null;

  const scenes = buildScriptScenes(content);

  return (
    <DeviceFrame className="overflow-hidden border-amber-100 bg-[#fffdfa]">
      <div className="border-b border-amber-100 bg-[linear-gradient(135deg,#fff7ec,#fffdf8)] px-7 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700">视频脚本</Badge>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-500">
            <Timer className="size-4 text-amber-500" />
            {content.duration || "时长待补充"}
          </div>
        </div>
        <h3 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight text-slate-950">
          {content.title || "请输入视频脚本标题"}
        </h3>
        {content.hook ? (
          <div className="mt-5 rounded-[24px] border border-amber-200 bg-white/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Hook</p>
            <p className="mt-2 text-base leading-7 text-slate-700">{content.hook}</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 px-6 py-6">
        {scenes.map((scene, index) => (
          <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
            <div className="grid gap-0 lg:grid-cols-[140px_minmax(0,1fr)_220px]">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 lg:border-b-0 lg:border-r">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Scene {index + 1}</div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
                  <Clapperboard className="size-4" />
                  镜头
                </div>
              </div>
              <div className="border-b border-slate-100 px-5 py-4 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">口播 / 文案</p>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{scene.copy}</p>
              </div>
              <div className="bg-[linear-gradient(180deg,#fffdfa,#fff7ec)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">画面 / 备注</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{scene.visual}</p>
              </div>
            </div>
          </div>
        ))}

        {content.transition || content.endingCta || content.voiceoverNotes ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoTile title="Transition" value={content.transition} />
            <InfoTile title="Ending CTA" value={content.endingCta} />
            <InfoTile title="Voiceover Notes" value={content.voiceoverNotes} />
          </div>
        ) : null}
      </div>
    </DeviceFrame>
  );
}

function InfoTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{value || "待补充"}</p>
    </div>
  );
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHashtags(hashtags: string[]) {
  return hashtags
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean);
}

function buildScriptScenes(content: VideoScriptContent) {
  const chunks = [content.body, content.transition, content.endingCta]
    .flatMap((part) => part.split(/\n{2,}/))
    .map((item) => item.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return [
      {
        copy: "脚本正文尚未填写。",
        visual: content.voiceoverNotes || "在这里补充镜头调度、字幕风格和画面提示。",
      },
    ];
  }

  return chunks.map((chunk, index) => ({
    copy: chunk,
    visual:
      index === 0
        ? content.voiceoverNotes || "建议使用开场强冲突画面或数字信息卡。"
        : `镜头建议 ${index + 1}：围绕这一段文案补充演示画面、人物表情或产品细节。`,
  }));
}
