"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Bot, FileStack, LoaderCircle, ScrollText, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { TwitterEditor } from "@/components/editors/TwitterEditor";
import { VideoScriptEditor } from "@/components/editors/VideoScriptEditor";
import { WechatEditor } from "@/components/editors/WechatEditor";
import { XiaohongshuEditor } from "@/components/editors/XiaohongshuEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformTabs } from "@/components/workspace/PlatformTabs";
import { TaskHistorySidebar } from "@/components/workspace/TaskHistorySidebar";
import { WorkspaceActions } from "@/components/workspace/WorkspaceActions";
import { WorkspacePreviewDialog } from "@/components/workspace/WorkspacePreviewDialog";
import { WorkspacePreviewPanel } from "@/components/workspace/WorkspacePreviewPanel";
import { getPlatformExportData } from "@/lib/export";
import { PLATFORM_LABELS, TASK_STATUS_LABELS } from "@/lib/platforms";
import {
  buildWorkbenchTimeline,
  getReferenceArticlePlaceholders,
  getTaskSummaryItems,
  getTaskSummaryMeta,
  mapTaskInputToContext,
} from "@/lib/workbench";
import { downloadFile, formatDateTime } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";

type InstructionEntry = {
  id: string;
  platform: PlatformType;
  prompt: string;
  createdAt: string;
};

export function WorkspaceShell({
  taskId,
  initialTask,
  initialHistoryTasks,
}: {
  taskId: string;
  initialTask: Task;
  initialHistoryTasks: Task[];
}) {
  const {
    currentTask,
    historyTasks,
    currentPlatform,
    isEditing,
    saveState,
    setCurrentTask,
    setCurrentPlatform,
    setHistoryTasks,
    setSaveState,
    applySavedTask,
    syncHistoryTask,
    updateCurrentTaskContents,
    updateHistoryTask,
  } = useWorkspaceStore();
  const router = useRouter();
  const [isLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(initialTask.status === "generating");
  const [instructionInput, setInstructionInput] = useState("");
  const [instructionHistory, setInstructionHistory] = useState<InstructionEntry[]>([]);
  const latestTaskRef = useRef<Task | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const generationRequestRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentTask(initialTask);
    setHistoryTasks(initialHistoryTasks);
    setIsGenerating(initialTask.status === "generating");
  }, [initialHistoryTasks, initialTask, setCurrentTask, setHistoryTasks]);

  const displayTask = currentTask?.id === taskId ? currentTask : initialTask;
  const displayHistoryTasks = historyTasks.length > 0 ? historyTasks : initialHistoryTasks;

  useEffect(() => {
    latestTaskRef.current = displayTask;
  }, [displayTask]);

  useEffect(() => {
    async function load() {
      try {
        setHasLoadError(false);
        const [taskResponse, tasksResponse] = await Promise.all([
          fetch(`/api/tasks/${taskId}`),
          fetch("/api/tasks"),
        ]);

        if (!taskResponse.ok || !tasksResponse.ok) {
          throw new Error("加载工作台失败");
        }

        const task: Task = await taskResponse.json();
        const tasks: Task[] = await tasksResponse.json();
        setCurrentTask(task);
        setHistoryTasks(tasks);
      } catch (error) {
        console.error(error);
        setHasLoadError(true);
        toast.error("工作台加载失败");
      }
    }

    void load();
  }, [taskId, setCurrentTask, setHistoryTasks]);

  useEffect(() => {
    if (displayTask.status !== "generating") {
      setIsGenerating(false);
      return;
    }

    if (generationRequestRef.current === displayTask.id) {
      return;
    }

    generationRequestRef.current = displayTask.id;
    setIsGenerating(true);

    async function generate() {
      try {
        const response = await fetch(`/api/tasks/${displayTask.id}/generate`, {
          method: "POST",
        });
        const data = (await response.json().catch(() => null)) as
          | Task
          | {
              message?: string;
              task?: Task;
            }
          | null;

        if (!response.ok) {
          if (data && "task" in data && data.task) {
            setCurrentTask(data.task);
            updateHistoryTask(data.task);
          }
          throw new Error((data && "message" in data && data.message) || "内容生成失败");
        }

        const task = data as Task;
        setCurrentTask(task);
        updateHistoryTask(task);
        toast.success("内容生成完成，已进入工作台");
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "内容生成失败");
      } finally {
        setIsGenerating(false);
      }
    }

    void generate();
  }, [displayTask.id, displayTask.status, setCurrentTask, updateHistoryTask]);

  const activePlatform = useMemo<PlatformType | null>(() => {
    return currentPlatform ?? displayTask.selectedPlatforms[0] ?? null;
  }, [currentPlatform, displayTask.selectedPlatforms]);
  const previewTask = useDeferredValue(displayTask);

  const saveTask = useCallback(
    async (showToast = false): Promise<boolean> => {
      const task = latestTaskRef.current;
      if (!task) return true;
      if (saveInFlightRef.current) {
        queuedSaveRef.current = true;
        return false;
      }

      const snapshotTaskId = task.id;
      const snapshotContents = JSON.stringify(task.contents);

      setSaveState("saving");
      saveInFlightRef.current = true;

      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: task.status === "published_mock" ? "published_mock" : "edited",
            contents: task.contents,
          }),
        });

        if (!response.ok) {
          throw new Error("保存失败");
        }

        const savedTask: Task = await response.json();
        const latestTask = latestTaskRef.current;
        const isSnapshotStillCurrent =
          latestTask?.id === snapshotTaskId && JSON.stringify(latestTask.contents) === snapshotContents;

        if (isSnapshotStillCurrent) {
          applySavedTask(savedTask);
          setSaveState("saved");
          if (showToast) {
            toast.success("内容已保存");
          }
        } else {
          syncHistoryTask(savedTask);
          setSaveState("idle");
          queuedSaveRef.current = true;
        }

        return true;
      } catch (error) {
        console.error(error);
        setSaveState("error");
        toast.error(showToast ? "保存失败" : "自动保存失败");
        return false;
      } finally {
        saveInFlightRef.current = false;
        if (queuedSaveRef.current) {
          queuedSaveRef.current = false;
          void saveTask(false);
        }
      }
    },
    [applySavedTask, setSaveState, syncHistoryTask],
  );

  useEffect(() => {
    if (!isEditing) return;
    const timer = window.setTimeout(() => {
      void saveTask(false);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [displayTask, isEditing, saveTask]);

  useEffect(() => {
    if (!isEditing && saveState !== "saving") return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditing, saveState]);

  const workbenchTimeline = useMemo(() => buildWorkbenchTimeline(displayTask), [displayTask]);
  const summaryItems = useMemo(() => getTaskSummaryItems(displayTask), [displayTask]);
  const summaryMeta = useMemo(() => getTaskSummaryMeta(displayTask), [displayTask]);
  const taskContext = useMemo(() => mapTaskInputToContext(displayTask.input), [displayTask.input]);
  const referenceArticles = useMemo(() => getReferenceArticlePlaceholders(displayTask), [displayTask]);
  const versionCount = useMemo(
    () => workbenchTimeline.filter((item) => item.label !== TASK_STATUS_LABELS.generating).length,
    [workbenchTimeline],
  );

  function handleSave() {
    void saveTask(true);
  }

  async function ensureTaskSaved() {
    if (!isEditing && saveState !== "error") {
      return true;
    }

    return saveTask(true);
  }

  function handleCopy() {
    if (!activePlatform) return;
    const data = getPlatformExportData(activePlatform, displayTask.contents);
    navigator.clipboard.writeText(data.txt).then(
      () => toast.success("已复制当前平台内容"),
      () => toast.error("复制失败"),
    );
  }

  function handleExportTxt() {
    if (!activePlatform) return;
    const data = getPlatformExportData(activePlatform, displayTask.contents);
    downloadFile(`${displayTask.title}-${activePlatform}.txt`, data.txt, "text/plain;charset=utf-8");
  }

  function handleExportJson() {
    if (!activePlatform) return;
    const data = getPlatformExportData(activePlatform, displayTask.contents);
    downloadFile(`${displayTask.title}-${activePlatform}.json`, data.json, "application/json;charset=utf-8");
  }

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

  async function handleAiPolish(directive?: string) {
    if (!activePlatform) return;
    if (!displayTask.contents[activePlatform]) {
      toast.error("当前平台还没有可优化的内容");
      return;
    }

    setIsPolishing(true);

    try {
      const response = await fetch(`/api/tasks/${displayTask.id}/ai-polish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: activePlatform,
          directive,
          input: displayTask.input,
          contents: displayTask.contents,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message || "AI 修改失败");
      }

      const data = (await response.json()) as {
        platform: PlatformType;
        content: Task["contents"][PlatformType];
      };

      updateCurrentTaskContents({
        ...displayTask.contents,
        [data.platform]: data.content,
      });

      if (directive) {
        setInstructionHistory((current) => [
          {
            id: crypto.randomUUID(),
            platform: activePlatform,
            prompt: directive,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        setInstructionInput("");
        toast.success("已根据修改要求更新当前平台内容");
      } else {
        toast.success("已完成降 AI 风格优化");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "AI 修改失败");
    } finally {
      setIsPolishing(false);
    }
  }

  function handleApplyInstruction() {
    if (!instructionInput.trim()) {
      toast.error("请先输入一条修改要求");
      return;
    }

    void handleAiPolish(instructionInput.trim());
  }

  function handleSelectTask(nextTaskId: string) {
    if (nextTaskId === displayTask.id) return;

    if (isEditing || saveState === "saving") {
      const confirmed = window.confirm("当前任务还有未保存修改，确认离开当前页面吗？");
      if (!confirmed) return;
    }

    router.push(`/workspace/${nextTaskId}`);
  }

  function renderEditor() {
    if (!activePlatform) return null;

    if (activePlatform === "wechat" && displayTask.contents.wechat) {
      return (
        <WechatEditor
          content={displayTask.contents.wechat}
          onChange={(content) =>
            updateCurrentTaskContents({
              ...displayTask.contents,
              wechat: content,
            })
          }
        />
      );
    }

    if (activePlatform === "xiaohongshu" && displayTask.contents.xiaohongshu) {
      return (
        <XiaohongshuEditor
          content={displayTask.contents.xiaohongshu}
          onChange={(content) =>
            updateCurrentTaskContents({
              ...displayTask.contents,
              xiaohongshu: content,
            })
          }
        />
      );
    }

    if (activePlatform === "twitter" && displayTask.contents.twitter) {
      return (
        <TwitterEditor
          content={displayTask.contents.twitter}
          onChange={(content) =>
            updateCurrentTaskContents({
              ...displayTask.contents,
              twitter: content,
            })
          }
        />
      );
    }

    if (activePlatform === "video_script" && displayTask.contents.video_script) {
      return (
        <VideoScriptEditor
          content={displayTask.contents.video_script}
          onChange={(content) =>
            updateCurrentTaskContents({
              ...displayTask.contents,
              video_script: content,
            })
          }
        />
      );
    }

    return (
      <div className="rounded-[28px] border border-dashed border-primary/25 bg-primary/5 px-5 py-8 text-sm leading-6 text-slate-600">
        当前平台内容仍在准备中，生成完成后这里会自动切换到对应编辑入口。
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState title="加载工作台..." description="正在读取任务详情和历史记录" />;
  }

  if (hasLoadError) {
    return (
      <EmptyState
        title="工作台加载失败"
        description="任务详情或历史记录暂时无法读取。你可以刷新页面重试，或返回首页重新创建任务。"
      />
    );
  }

  if (!activePlatform) {
    return <EmptyState title="任务不存在" description="当前任务未找到，或者已经被移除。" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_30%),linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 lg:p-6">
      <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)]">
        <TaskHistorySidebar
          tasks={displayHistoryTasks}
          activeTaskId={displayTask.id}
          onSelectTask={handleSelectTask}
        />

        <main className="space-y-6">
          <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/">返回 Content Studio</Link>
                  </Button>
                  <Badge>内容创作工作台</Badge>
                  <Badge variant={displayTask.status === "published_mock" ? "success" : "default"}>
                    {TASK_STATUS_LABELS[displayTask.status]}
                  </Badge>
                  <Button variant="outline" asChild>
                    <a href="#workbench-history">版本历史 {versionCount}</a>
                  </Button>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{displayTask.title}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    由 Content Studio 创建的任务已进入工作台。这里负责继续生成、精修、预览和发布前检查。
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                <p>最近更新时间：{formatDateTime(displayTask.updatedAt)}</p>
                <p>当前平台：{PLATFORM_LABELS[activePlatform]}</p>
                <p>{isGenerating ? "生成流程进行中" : "可继续人工编辑或发起 AI 修改"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <PlatformTabs
                value={activePlatform}
                platforms={displayTask.selectedPlatforms}
                onChange={setCurrentPlatform}
              />
              <WorkspaceActions
                onSave={handleSave}
                onCopy={handleCopy}
                onExportTxt={handleExportTxt}
                onExportJson={handleExportJson}
                onOpenPreview={() => setIsPreviewOpen(true)}
                onAiPolish={() => void handleAiPolish()}
                onMockPublish={handleMockPublish}
                isSaving={saveState === "saving"}
                isPolishing={isPolishing}
                isPublishing={isPublishing}
                saveState={saveState}
                isEditing={isEditing}
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white/78 p-5 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">任务摘要</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{taskContext.topic}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summaryMeta.map((item) => (
                    <Badge key={item} variant="outline" className="bg-white">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <details className="group w-full max-w-xl rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 lg:w-auto">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
                  展开查看完整任务信息
                </summary>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.value}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">补充素材</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{taskContext.extraMaterials || "暂无补充素材"}</p>
                  </div>
                </div>
              </details>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
            <div className="space-y-6">
              <section id="workbench-history" className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-panel">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">创作协作区</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">AI 生成说明与修改轨迹</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      左侧聚焦协作过程，不重复大面积表单。你可以查看任务来龙去脉、继续输入修改意见，并进入当前平台的编辑入口。
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {workbenchTimeline.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <Sparkles className="size-4 text-sky-500" />
                        {item.label}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                  ))}
                  {instructionHistory.map((entry) => (
                    <div key={entry.id} className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-900">
                        <Wand2 className="size-4" />
                        第 {instructionHistory.length - instructionHistory.indexOf(entry)} 轮修改
                        <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
                          {PLATFORM_LABELS[entry.platform]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-emerald-900/85">{entry.prompt}</p>
                      <p className="mt-2 text-xs text-emerald-700/80">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">告诉我如何修改内容……</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        修改要求会作用到当前平台，并记录为新一轮创作轨迹。适合重写开头、调整语气、缩短篇幅或改成更适合平台的表达。
                      </p>
                    </div>
                    <Badge variant="outline" className="self-start bg-white">
                      当前平台：{PLATFORM_LABELS[activePlatform]}
                    </Badge>
                  </div>
                  <Textarea
                    className="mt-4 min-h-28 bg-white"
                    value={instructionInput}
                    onChange={(event) => setInstructionInput(event.target.value)}
                    placeholder="告诉我如何修改内容……例如：把开头改得更像公众号编辑手记，段落更短，结尾加一个明确 CTA。"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={handleApplyInstruction} disabled={isPolishing || isGenerating}>
                      {isPolishing ? <LoaderCircle className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                      应用到当前平台
                    </Button>
                    <Button variant="outline" onClick={() => void handleAiPolish()} disabled={isPolishing || isGenerating}>
                      <Sparkles className="size-4" />
                      一键自然化优化
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-panel">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">当前平台内容编辑入口</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{PLATFORM_LABELS[activePlatform]} 编辑区</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      这里保留结构化字段编辑，不把工作台做成单纯聊天页。右侧预览会跟随这里的内容同步更新。
                    </p>
                  </div>
                  <Badge variant="outline" className="self-start bg-white">
                    原文与预览联动中
                  </Badge>
                </div>

                <div className="mt-5">
                  {isGenerating ? (
                    <div className="rounded-[28px] border border-dashed border-sky-200 bg-sky-50/70 px-5 py-8 text-sky-900">
                      <div className="flex items-center gap-3 text-base font-semibold">
                        <LoaderCircle className="size-5 animate-spin" />
                        正在生成 {displayTask.selectedPlatforms.length} 个平台版本
                      </div>
                      <p className="mt-3 text-sm leading-6 text-sky-800/80">
                        任务已经创建成功，工作台会在生成完成后自动加载当前平台的编辑入口和预览内容。
                      </p>
                    </div>
                  ) : (
                    renderEditor()
                  )}
                </div>
              </section>

              <section className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-panel">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <ScrollText className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">参考文章输入</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">为后续爬取平台预留的参考位</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      这里将承接后续导入的参考文章标题、结构和内容块。当前先用结构化占位和补充素材摘要把接口位置留出来。
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {referenceArticles.map((article) => (
                    <div key={article.id} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <FileStack className="size-4 text-amber-500" />
                        {article.title}
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{article.source}</p>
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">结构</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {article.structure?.map((item) => (
                              <Badge key={item} variant="outline" className="bg-white">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">内容块</p>
                          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                            {article.blocks?.map((block) => (
                              <div key={block} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                                {block}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <WorkspacePreviewPanel
              task={previewTask}
              activePlatform={activePlatform}
              onPlatformChange={setCurrentPlatform}
              onExpand={() => setIsPreviewOpen(true)}
            />
          </div>

          <WorkspacePreviewDialog
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            task={previewTask}
            activePlatform={activePlatform}
            onPlatformChange={setCurrentPlatform}
          />
        </main>
      </div>
    </div>
  );
}
