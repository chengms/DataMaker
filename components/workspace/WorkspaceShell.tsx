"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { TwitterEditor } from "@/components/editors/TwitterEditor";
import { VideoScriptEditor } from "@/components/editors/VideoScriptEditor";
import { WechatEditor } from "@/components/editors/WechatEditor";
import { XiaohongshuEditor } from "@/components/editors/XiaohongshuEditor";
import { TaskHistorySidebar } from "@/components/workspace/TaskHistorySidebar";
import { PlatformTabs } from "@/components/workspace/PlatformTabs";
import { WorkspaceActions } from "@/components/workspace/WorkspaceActions";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { getPlatformExportData } from "@/lib/export";
import { downloadFile } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";

export function WorkspaceShell({ taskId }: { taskId: string }) {
  const {
    currentTask,
    historyTasks,
    currentPlatform,
    saveState,
    setCurrentTask,
    setCurrentPlatform,
    setHistoryTasks,
    setSaveState,
    updateCurrentTaskContents,
    updateHistoryTask,
  } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
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
        toast.error("工作台加载失败");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [taskId, setCurrentTask, setHistoryTasks]);

  const activePlatform = useMemo<PlatformType | null>(() => {
    if (!currentTask) return null;
    return currentPlatform ?? currentTask.selectedPlatforms[0] ?? null;
  }, [currentPlatform, currentTask]);

  async function handleSave() {
    if (!currentTask) return;

    setSaveState("saving");

    try {
      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentTask.status === "published_mock" ? "published_mock" : "edited",
          contents: currentTask.contents,
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      const task: Task = await response.json();
      updateHistoryTask(task);
      setSaveState("saved");
      toast.success("内容已保存");
    } catch (error) {
      console.error(error);
      setSaveState("error");
      toast.error("保存失败");
    }
  }

  function handleCopy() {
    if (!currentTask || !activePlatform) return;
    const data = getPlatformExportData(activePlatform, currentTask.contents);
    navigator.clipboard.writeText(data.txt).then(
      () => toast.success("已复制当前平台内容"),
      () => toast.error("复制失败"),
    );
  }

  function handleExportTxt() {
    if (!currentTask || !activePlatform) return;
    const data = getPlatformExportData(activePlatform, currentTask.contents);
    downloadFile(`${currentTask.title}-${activePlatform}.txt`, data.txt, "text/plain;charset=utf-8");
  }

  function handleExportJson() {
    if (!currentTask || !activePlatform) return;
    const data = getPlatformExportData(activePlatform, currentTask.contents);
    downloadFile(`${currentTask.title}-${activePlatform}.json`, data.json, "application/json;charset=utf-8");
  }

  async function handleMockPublish() {
    if (!currentTask) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/tasks/${currentTask.id}/mock-publish`, {
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

  if (isLoading) {
    return <LoadingState title="加载工作台..." description="正在读取任务详情和历史记录" />;
  }

  if (!currentTask || !activePlatform) {
    return <EmptyState title="任务不存在" description="当前任务未找到，或者已经被移除。" />;
  }

  return (
    <div className="grid min-h-screen gap-6 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
      <TaskHistorySidebar tasks={historyTasks} activeTaskId={currentTask.id} />

      <main className="space-y-6">
        <WorkspaceHeader task={currentTask} />

        <div className="rounded-[28px] border bg-white/80 p-5 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PlatformTabs
              value={activePlatform}
              platforms={currentTask.selectedPlatforms}
              onChange={setCurrentPlatform}
            />
            <WorkspaceActions
              onSave={handleSave}
              onCopy={handleCopy}
              onExportTxt={handleExportTxt}
              onExportJson={handleExportJson}
              onMockPublish={handleMockPublish}
              isSaving={saveState === "saving"}
              isPublishing={isPublishing}
            />
          </div>
        </div>

        {activePlatform === "wechat" && currentTask.contents.wechat ? (
          <WechatEditor
            content={currentTask.contents.wechat}
            onChange={(content) =>
              updateCurrentTaskContents({
                ...currentTask.contents,
                wechat: content,
              })
            }
          />
        ) : null}

        {activePlatform === "xiaohongshu" && currentTask.contents.xiaohongshu ? (
          <XiaohongshuEditor
            content={currentTask.contents.xiaohongshu}
            onChange={(content) =>
              updateCurrentTaskContents({
                ...currentTask.contents,
                xiaohongshu: content,
              })
            }
          />
        ) : null}

        {activePlatform === "twitter" && currentTask.contents.twitter ? (
          <TwitterEditor
            content={currentTask.contents.twitter}
            onChange={(content) =>
              updateCurrentTaskContents({
                ...currentTask.contents,
                twitter: content,
              })
            }
          />
        ) : null}

        {activePlatform === "video_script" && currentTask.contents.video_script ? (
          <VideoScriptEditor
            content={currentTask.contents.video_script}
            onChange={(content) =>
              updateCurrentTaskContents({
                ...currentTask.contents,
                video_script: content,
              })
            }
          />
        ) : null}
      </main>
    </div>
  );
}
