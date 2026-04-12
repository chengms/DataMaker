"use client";

import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WorkspacePreviewContent } from "@/components/workspace/WorkspacePreviewContent";

export function WorkspacePreviewDialog({
  open,
  onOpenChange,
  task,
  activePlatform,
  onPlatformChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  activePlatform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] max-w-6xl overflow-hidden border-white/80 bg-transparent p-0 shadow-none">
        <WorkspacePreviewContent
          task={task}
          activePlatform={activePlatform}
          onPlatformChange={onPlatformChange}
          onExpand={() => onOpenChange(true)}
          mode="dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
