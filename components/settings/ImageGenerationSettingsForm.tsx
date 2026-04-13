"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { imageGenerationSettingsSchema } from "@/lib/schemas";
import { IMAGE_STYLE_PRESET_LABELS } from "@/lib/image-generation/presets";
import type { ImageGenerationSettings, ImageStylePreset } from "@/types/settings";

const formSchema = imageGenerationSettingsSchema;
type FormValues = z.infer<typeof formSchema>;

export function ImageGenerationSettingsForm({
  settings,
  isSaving,
  onSave,
  onReset,
}: {
  settings: ImageGenerationSettings;
  isSaving?: boolean;
  onSave: (values: FormValues) => void | Promise<void>;
  onReset: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

  const selectedPreset = form.watch("stylePreset");

  return (
    <form
      className="space-y-5 rounded-[28px] border bg-white/80 p-6 shadow-panel"
      onSubmit={form.handleSubmit((values) => onSave({ ...values, provider: "minimax" }))}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Image Generation</p>
        <h2 className="mt-2 text-2xl font-semibold">图片风格预设</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          自动配图默认接入 MiniMax。这里控制是否启用自动配图、默认风格预设以及自定义风格补充描述。
        </p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-card/70 px-4 py-3">
        <div>
          <p className="font-medium">启用自动配图</p>
          <p className="text-sm text-muted-foreground">开启后，公众号和小红书会在生成正文后自动规划并生成图片。</p>
        </div>
        <Switch checked={form.watch("enabled")} onCheckedChange={(checked) => form.setValue("enabled", checked)} />
      </div>

      <div className="rounded-2xl border bg-slate-50/80 px-4 py-3">
        <p className="text-sm font-medium text-slate-900">图片生成提供方</p>
        <p className="mt-1 text-sm text-slate-600">当前默认固定为 MiniMax，代码已预留未来扩展其他 provider 的结构。</p>
      </div>

      <div className="space-y-3">
        <Label>图片风格预设</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(IMAGE_STYLE_PRESET_LABELS) as ImageStylePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => form.setValue("stylePreset", preset, { shouldDirty: true })}
              className={
                selectedPreset === preset
                  ? "rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-left text-primary transition"
                  : "rounded-2xl border bg-white px-4 py-3 text-left text-slate-700 transition hover:border-primary/40"
              }
            >
              {IMAGE_STYLE_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>自定义风格补充</Label>
        <Textarea
          {...form.register("customStylePrompt")}
          className="min-h-28"
          placeholder="例如：强调高端杂志感、画面留白、偏冷色调、避免人物正脸。"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          保存设置
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置默认
        </Button>
      </div>
    </form>
  );
}
