"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { LoaderCircle, ScanSearch, Settings2, Sparkles } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { taskInputSchema } from "@/lib/schemas";
import type { PlatformType } from "@/types/content";
import type { InputReviewResult } from "@/types/review";
import type { Task } from "@/types/task";
import type { z } from "zod";

type CreateTaskValues = z.infer<typeof taskInputSchema>;

function CreateTaskFormSkeleton() {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-panel">
      <div className="space-y-3">
        <div className="h-7 w-64 rounded-full bg-slate-200/80" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-slate-100" />
        <div className="h-4 w-full max-w-xl rounded-full bg-slate-100" />
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-5 w-24 rounded-full bg-slate-200/80" />
        <div className="h-36 rounded-2xl bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-44 rounded-[24px] bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92))]" />
      </div>
    </div>
  );
}

export function CreateTaskForm({ enabledPlatforms }: { enabledPlatforms: PlatformType[] }) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [autoAiReview, setAutoAiReview] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<InputReviewResult | null>(null);
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
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const filtered = selectedPlatforms.filter((platform) => enabledPlatforms.includes(platform));
    if (filtered.length !== selectedPlatforms.length) {
      form.setValue("selectedPlatforms", filtered, { shouldValidate: true });
    }
  }, [enabledPlatforms, form, selectedPlatforms]);

  if (!isHydrated) {
    return <CreateTaskFormSkeleton />;
  }

  async function runAiReview(values: CreateTaskValues) {
    setIsReviewing(true);
    try {
      const response = await fetch("/api/input-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message || "AI 输入检查失败");
      }

      const result = (await response.json()) as InputReviewResult;
      setReviewResult(result);
      return result;
    } finally {
      setIsReviewing(false);
    }
  }

  async function onSubmit(values: CreateTaskValues) {
    const filteredPlatforms = values.selectedPlatforms.filter((platform) => enabledPlatforms.includes(platform));
    if (filteredPlatforms.length === 0) {
      form.setError("selectedPlatforms", {
        message: "当前没有可用平台，请先到设置页启用至少一个平台",
      });
      return;
    }

    try {
      if (autoAiReview) {
        const review = await runAiReview({
          ...values,
          selectedPlatforms: filteredPlatforms,
        });

        if (review.status === "needs_attention") {
          toast.warning("AI 检查发现输入还有优化空间，请先根据建议调整");
          return;
        }
      }

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

  async function handleManualReview() {
    const values = form.getValues();
    const filteredPlatforms = values.selectedPlatforms.filter((platform) => enabledPlatforms.includes(platform));

    if (!values.topic.trim()) {
      form.setError("topic", {
        message: "请输入创作主题后再进行 AI 检查",
      });
      return;
    }

    try {
      const result = await runAiReview({
        ...values,
        selectedPlatforms: filteredPlatforms,
      });

      toast.success(result.status === "pass" ? "AI 检查通过，可以继续生成" : "AI 已返回优化建议");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "AI 输入检查失败");
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

          <div className="space-y-4 rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92))] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  <Sparkles className="size-4" />
                  AI检查优化
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">生成前检查输入质量</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    让 AI 先检查选题是否过泛、信息是否缺失、平台约束是否不够清晰，再决定是否直接生成。
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-sky-100 bg-white/85 px-4 py-2">
                <Switch checked={autoAiReview} onCheckedChange={setAutoAiReview} />
                <div>
                  <p className="text-sm font-medium text-slate-900">生成前自动检查</p>
                  <p className="text-xs text-slate-500">发现问题时先提示，不直接生成</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => void handleManualReview()} disabled={isReviewing}>
                {isReviewing ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
                AI检查输入
              </Button>
            </div>

            {reviewResult ? (
              <div className="rounded-[22px] border border-white/90 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {reviewResult.status === "pass" ? "AI 检查通过" : "AI 建议先优化输入"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{reviewResult.summary}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {reviewResult.issues.length} 条提示
                  </div>
                </div>

                {reviewResult.issues.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {reviewResult.issues.map((issue, index) => (
                      <div
                        key={`${issue.field}-${index}`}
                        className="rounded-2xl border px-4 py-3 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              issue.severity === "error"
                                ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                                : issue.severity === "warning"
                                  ? "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                  : "rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                            }
                          >
                            {issue.severity === "error" ? "严重" : issue.severity === "warning" ? "注意" : "建议"}
                          </span>
                          <span className="font-medium text-slate-900">{issue.title}</span>
                        </div>
                        <p className="mt-2 text-slate-700">{issue.message}</p>
                        {issue.suggestion ? <p className="mt-1 text-slate-500">建议：{issue.suggestion}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">平台选择</p>
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
                <p className="text-sm font-medium text-foreground">Twitter 模式</p>
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
              isReviewing ||
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
