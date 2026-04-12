import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PLATFORM_LABELS, TASK_STATUS_LABELS } from "@/lib/platforms";
import { formatDateTime } from "@/lib/utils";
import type { Task } from "@/types/task";

export function WorkspaceHeader({ task }: { task: Task }) {
  return (
    <div className="rounded-[28px] border bg-white/80 p-6 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="size-4" />
                返回主界面
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">
                <Plus className="size-4" />
                新建任务
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <Badge variant={task.status === "published_mock" ? "success" : "default"}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {task.input.topic}
            {task.input.audience ? ` · 面向 ${task.input.audience}` : ""}
            {task.input.contentGoal ? ` · 目标 ${task.input.contentGoal}` : ""}
            {task.input.tone ? ` · 风格 ${task.input.tone}` : ""}
          </p>
        </div>

        <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          最近更新时间：{formatDateTime(task.updatedAt)}
        </div>
      </div>

      <Separator className="my-5" />

      <div className="flex flex-wrap gap-2">
        {task.selectedPlatforms.map((platform) => (
          <Badge key={platform} variant="outline">
            {PLATFORM_LABELS[platform]}
          </Badge>
        ))}
      </div>
    </div>
  );
}
