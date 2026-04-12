"use client";

import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";

import { WorkspacePreviewContent } from "@/components/workspace/WorkspacePreviewContent";

export function WorkspacePreviewPanel({
  task,
  activePlatform,
  onPlatformChange,
  onExpand,
}: {
  task: Task;
  activePlatform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
  onExpand: () => void;
}) {
  return (
    <div className="hidden xl:block">
      <div className="sticky top-6">
        <WorkspacePreviewContent
          task={task}
          activePlatform={activePlatform}
          onPlatformChange={onPlatformChange}
          onExpand={onExpand}
        />
      </div>
    </div>
  );
}
