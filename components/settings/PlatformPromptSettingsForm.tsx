"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_LABELS } from "@/lib/platforms";
import type { PlatformType } from "@/types/content";

const formSchema = z.object({
  prompt: z.string().max(6000, "提示词长度不能超过 6000 个字符"),
});

type FormValues = z.infer<typeof formSchema>;

export function PlatformPromptSettingsForm({
  platform,
  prompt,
  defaultPrompt,
  isSaving,
  onSave,
}: {
  platform: PlatformType;
  prompt: string;
  defaultPrompt: string;
  isSaving?: boolean;
  onSave: (prompt: string) => void | Promise<void>;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt,
    },
  });

  useEffect(() => {
    form.reset({ prompt });
  }, [form, prompt]);

  async function handleResetToDefault() {
    setIsResetting(true);
    try {
      await onSave("");
      form.reset({ prompt: "" });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-[28px] border bg-white/80 p-6 shadow-panel"
      onSubmit={form.handleSubmit(async (values) => {
        await onSave(values.prompt);
        form.reset(values);
      })}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Platform Prompt Settings</p>
        <h2 className="mt-2 text-2xl font-semibold">{PLATFORM_LABELS[platform]} 平台提示词设置</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          这里保存的是附加平台提示词。生成时会在基础 System Prompt 之后追加这一段；留空时自动回退到默认平台提示词。
        </p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-900">默认说明</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{defaultPrompt}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>自定义平台提示词</Label>
          {form.formState.isDirty ? (
            <span className="text-xs font-medium text-amber-600">未保存修改</span>
          ) : (
            <span className="text-xs text-slate-500">{form.watch("prompt") ? "当前使用自定义配置" : "当前回退默认配置"}</span>
          )}
        </div>
        <Textarea
          {...form.register("prompt")}
          className="min-h-56 max-h-[28rem] overflow-y-auto"
          placeholder="留空则使用默认平台提示词。你可以在这里补充这个平台独有的口吻、结构、禁用项或表达偏好。"
        />
        {form.formState.errors.prompt ? (
          <p className="text-sm text-destructive">{form.formState.errors.prompt.message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving}>
          保存提示词
        </Button>
        <Button type="button" variant="outline" onClick={() => void handleResetToDefault()} disabled={isSaving || isResetting}>
          重置默认
        </Button>
      </div>
    </form>
  );
}
