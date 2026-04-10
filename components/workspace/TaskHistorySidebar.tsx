"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDateTime, groupTasksByDay, cn } from "@/lib/utils";
import { TASK_STATUS_LABELS } from "@/lib/platforms";
import type { Task } from "@/types/task";

type TaskHistorySidebarProps = {
  tasks: Task[];
  activeTaskId?: string;
  onSelectTask?: (taskId: string) => void;
};

export function TaskHistorySidebar({
  tasks,
  activeTaskId,
  onSelectTask,
}: TaskHistorySidebarProps) {
  const grouped = groupTasksByDay(tasks);

  function handleClick(event: MouseEvent<HTMLAnchorElement>, taskId: string) {
    if (!onSelectTask) return;
    event.preventDefault();
    onSelectTask(taskId);
  }

  return (
    <aside className="flex h-full flex-col rounded-[28px] border bg-white/75 p-4 shadow-panel">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">History</p>
        <h2 className="mt-2 text-lg font-semibold">历史任务</h2>
      </div>

      <div className="space-y-5 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/70 p-4 text-sm text-muted-foreground">
            还没有历史任务。先从首页发起第一条多平台创作。
          </div>
        ) : null}
        {Object.entries(grouped).map(([day, dayTasks]) => (
          <div key={day}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{day}</p>
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/workspace/${task.id}`}
                  onClick={(event) => handleClick(event, task.id)}
                  className={cn(
                    "block rounded-2xl border p-3 transition hover:border-primary/40 hover:bg-primary/5",
                    task.id === activeTaskId ? "border-primary bg-primary/5" : "border-border bg-card/80",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(task.updatedAt)}</p>
                    </div>
                    <Badge variant={task.status === "published_mock" ? "success" : "secondary"}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
