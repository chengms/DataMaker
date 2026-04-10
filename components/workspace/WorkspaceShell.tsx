"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { TwitterEditor } from "@/components/editors/TwitterEditor";
import { VideoScriptEditor } from "@/components/editors/VideoScriptEditor";
import { WechatEditor } from "@/components/editors/WechatEditor";
import { XiaohongshuEditor } from "@/components/editors/XiaohongshuEditor";
import { PlatformTabs } from "@/components/workspace/PlatformTabs";
import { TaskHistorySidebar } from "@/components/workspace/TaskHistorySidebar";
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const latestTaskRef = useRef<Task | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);

  useEffect(() => {
    latestTaskRef.current = currentTask;
  }, [currentTask]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
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

  const saveTask = useCallback(
    async (showToast = false) => {
      const task = latestTaskRef.current;
      if (!task) return;
      if (saveInFlightRef.current) {
        queuedSaveRef.current = true;
        return;
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
      } catch (error) {
        console.error(error);
        setSaveState("error");
        toast.error(showToast ? "保存失败" : "自动保存失败");
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
    if (!currentTask || !isEditing) return;
    const timer = window.setTimeout(() => {
      void saveTask(false);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentTask, isEditing, saveTask]);

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

  function handleSave() {
    void saveTask(true);
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

  function handleSelectTask(nextTaskId: string) {
    if (nextTaskId === currentTask?.id) return;

    if (isEditing || saveState === "saving") {
      const confirmed = window.confirm("当前任务还有未保存修改，确认离开当前页面吗？");
      if (!confirmed) return;
    }

    router.push(`/workspace/${nextTaskId}`);
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

  if (!currentTask || !activePlatform) {
    return <EmptyState title="任务不存在" description="当前任务未找到，或者已经被移除。" />;
  }

  return (
    <div className="grid min-h-screen gap-6 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
      <TaskHistorySidebar
        tasks={historyTasks}
        activeTaskId={currentTask.id}
        onSelectTask={handleSelectTask}
      />

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
              saveState={saveState}
              isEditing={isEditing}
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
