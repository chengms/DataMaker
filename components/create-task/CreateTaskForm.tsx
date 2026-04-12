"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { LoaderCircle, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PlatformSelector } from "@/components/create-task/PlatformSelector";
import { TwitterModeSelector } from "@/components/create-task/TwitterModeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { taskInputSchema } from "@/lib/schemas";
import type { PlatformType } from "@/types/content";
import type { Task } from "@/types/task";
import type { z } from "zod";

type CreateTaskValues = z.infer<typeof taskInputSchema>;

export function CreateTaskForm({ enabledPlatforms }: { enabledPlatforms: PlatformType[] }) {
  const router = useRouter();
  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: {
      topic: "",
      audience: "",
      tone: "",
      contentGoal: "",
      lengthHint: "",
      materialNotes: "",
      selectedPlatforms: [],
      twitterMode: "single",
    },
  });

  const selectedPlatforms = form.watch("selectedPlatforms");
  const isTwitterEnabled = selectedPlatforms.includes("twitter");
  const showPlatformPrompt = enabledPlatforms.length > 0 && selectedPlatforms.length === 0;

  useEffect(() => {
    const filtered = selectedPlatforms.filter((platform) => enabledPlatforms.includes(platform));
    if (filtered.length !== selectedPlatforms.length) {
      form.setValue("selectedPlatforms", filtered, { shouldValidate: true });
    }
  }, [enabledPlatforms, form, selectedPlatforms]);

  async function onSubmit(values: CreateTaskValues) {
    const filteredPlatforms = values.selectedPlatforms.filter((platform) => enabledPlatforms.includes(platform));
    if (filteredPlatforms.length === 0) {
      form.setError("selectedPlatforms", {
        message: "当前没有可用平台，请先到设置页启用至少一个平台",
      });
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          selectedPlatforms: filteredPlatforms,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message || "任务创建失败");
      }

      const task: Task = await response.json();
      router.push(`/workspace/${task.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "任务创建失败，请稍后重试");
    }
  }

  return (
    <Card className="border-white/70 bg-white/80">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">单次输入，多平台并行产出</CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
            输入一次创作需求，直接生成公众号、小红书、Twitter 和视频脚本版本，然后继续进入工作台逐平台编辑。
          </CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings">
            <Settings2 className="size-4" />
            平台设置
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="topic">创作主题</Label>
            <Textarea
              id="topic"
              placeholder="例如：为一家 B2B SaaS 产品设计多平台内容选题，主题是 AI 数据分析工作流"
              {...form.register("topic")}
              className="min-h-36"
            />
            {form.formState.errors.topic ? (
              <p className="text-sm text-destructive">{form.formState.errors.topic.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience">受众</Label>
              <Input id="audience" placeholder="例如：内容运营负责人" {...form.register("audience")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">语气风格</Label>
              <Input id="tone" placeholder="例如：专业、利落" {...form.register("tone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentGoal">内容目标</Label>
              <Input id="contentGoal" placeholder="例如：建立认知并引导咨询" {...form.register("contentGoal")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lengthHint">长度提示</Label>
              <Input id="lengthHint" placeholder="例如：60 秒视频 / 1500 字长文" {...form.register("lengthHint")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialNotes">补充素材</Label>
            <Textarea
              id="materialNotes"
              placeholder="补充背景、素材、案例、关键词、希望强调的信息"
              {...form.register("materialNotes")}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>平台选择</Label>
              <p className="mt-1 text-sm text-muted-foreground">至少选择一个平台。历史记录以一次任务为单位保存。</p>
            </div>
            <PlatformSelector
              value={selectedPlatforms}
              enabledPlatforms={enabledPlatforms}
              onChange={(next) => form.setValue("selectedPlatforms", next, { shouldValidate: true })}
            />
            {showPlatformPrompt ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                请选择至少一个平台后再生成内容任务。
              </p>
            ) : null}
            {enabledPlatforms.length === 0 ? (
              <p className="text-sm text-destructive">当前所有平台都被关闭了，请先去设置页启用平台。</p>
            ) : null}
            {form.formState.errors.selectedPlatforms ? (
              <p className="text-sm text-destructive">{form.formState.errors.selectedPlatforms.message}</p>
            ) : null}
          </div>

          {isTwitterEnabled ? (
            <div className="space-y-3">
              <div>
                <Label>Twitter 模式</Label>
                <p className="mt-1 text-sm text-muted-foreground">Twitter 的 single 与 thread 是两套独立内容结构。</p>
              </div>
              <TwitterModeSelector
                value={form.watch("twitterMode")}
                onChange={(mode) => form.setValue("twitterMode", mode, { shouldValidate: true })}
              />
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={
              form.formState.isSubmitting ||
              !form.watch("topic") ||
              enabledPlatforms.length === 0
            }
            className="min-w-36"
          >
            {form.formState.isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            生成内容任务
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
