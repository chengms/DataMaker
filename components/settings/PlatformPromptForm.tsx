"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { platformPromptSettingsSchema } from "@/lib/schemas";
import { PLATFORM_LABELS } from "@/lib/platforms";
import type { PlatformPromptSettings } from "@/types/settings";
import type { PlatformType } from "@/types/content";

const formSchema = platformPromptSettingsSchema;
type FormValues = z.infer<typeof formSchema>;

export function PlatformPromptForm({
  platform,
  settings,
  onSave,
  onReset,
  isSaving,
}: {
  platform: PlatformType;
  settings: PlatformPromptSettings;
  onSave: (values: FormValues) => void | Promise<void>;
  onReset: () => void;
  isSaving?: boolean;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

  return (
    <form className="space-y-5 rounded-[28px] border bg-white/80 p-6 shadow-panel" onSubmit={form.handleSubmit(onSave)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Prompt Settings</p>
        <h2 className="mt-2 text-2xl font-semibold">{PLATFORM_LABELS[platform]}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          这里的 System Prompt、默认语气、默认长度和附加规则会参与当前平台的生成过程。
        </p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-card/70 px-4 py-3">
        <div>
          <p className="font-medium">启用该平台</p>
          <p className="text-sm text-muted-foreground">关闭后仍保留配置，但默认不参与生成。</p>
        </div>
        <Switch checked={form.watch("enabled")} onCheckedChange={(checked) => form.setValue("enabled", checked)} />
      </div>

      <div className="space-y-2">
        <Label>System Prompt</Label>
        <Textarea className="min-h-40" {...form.register("systemPrompt")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Default Tone</Label>
          <Input {...form.register("defaultTone")} />
        </div>
        <div className="space-y-2">
          <Label>Default Length</Label>
          <Input {...form.register("defaultLength")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Extra Rules</Label>
        <Textarea {...form.register("extraRules")} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          保存设置
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置默认值
        </Button>
      </div>
    </form>
  );
}
