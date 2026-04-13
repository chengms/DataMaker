import type { PlatformType, TwitterMode } from "@/types/content";
import type { SubTaskStatus, TaskStatus } from "@/types/task";

export const PLATFORM_OPTIONS: Array<{ value: PlatformType; label: string; description: string }> = [
  { value: "wechat", label: "公众号", description: "长文结构化内容" },
  { value: "xiaohongshu", label: "小红书", description: "图文分享与种草" },
  { value: "twitter", label: "Twitter", description: "Single / Thread 双模式" },
  { value: "video_script", label: "视频脚本", description: "短视频口播脚本" },
];

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  wechat: "公众号",
  xiaohongshu: "小红书",
  twitter: "Twitter",
  video_script: "视频脚本",
};

export const TWITTER_MODE_LABELS: Record<TwitterMode, string> = {
  single: "Single Tweet",
  thread: "Thread",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  draft: "草稿",
  generating: "生成中",
  generated: "已生成",
  edited: "已编辑",
  failed: "执行失败",
  published_mock: "已模拟发布",
};

export const SUBTASK_STATUS_LABELS: Record<SubTaskStatus, string> = {
  pending: "待执行",
  running: "执行中",
  completed: "已完成",
  failed: "失败",
};
