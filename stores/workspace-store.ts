"use client";

import { create } from "zustand";

import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";

export type SaveState = "idle" | "saving" | "saved" | "error";

type WorkspaceState = {
  currentTask: Task | null;
  historyTasks: Task[];
  currentPlatform: PlatformType | null;
  isEditing: boolean;
  saveState: SaveState;
  setCurrentTask: (task: Task | null) => void;
  setHistoryTasks: (tasks: Task[]) => void;
  setCurrentPlatform: (platform: PlatformType) => void;
  setIsEditing: (value: boolean) => void;
  setSaveState: (value: SaveState) => void;
  updateCurrentTaskContents: (contents: Task["contents"]) => void;
  updateHistoryTask: (task: Task) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentTask: null,
  historyTasks: [],
  currentPlatform: null,
  isEditing: false,
  saveState: "idle",
  setCurrentTask: (task) =>
    set((state) => ({
      currentTask: task,
      currentPlatform:
        task && (!state.currentPlatform || !task.selectedPlatforms.includes(state.currentPlatform))
          ? task.selectedPlatforms[0] ?? null
          : state.currentPlatform,
      isEditing: false,
    })),
  setHistoryTasks: (tasks) => set({ historyTasks: tasks }),
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),
  setIsEditing: (value) => set({ isEditing: value }),
  setSaveState: (value) => set({ saveState: value }),
  updateCurrentTaskContents: (contents) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          contents,
          status: state.currentTask.status === "generated" ? "edited" : state.currentTask.status,
        },
        isEditing: true,
      };
    }),
  updateHistoryTask: (task) =>
    set((state) => {
      const existing = state.historyTasks.find((item) => item.id === task.id);
      const nextHistory = existing
        ? state.historyTasks.map((item) => (item.id === task.id ? task : item))
        : [task, ...state.historyTasks];

      return {
        currentTask: state.currentTask?.id === task.id ? task : state.currentTask,
        historyTasks: nextHistory.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      };
    }),
}));
