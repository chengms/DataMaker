"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBuiltInProviders, getProviderPreset, PROVIDER_LABELS } from "@/lib/provider-presets";
import { providerSettingsSchema } from "@/lib/schemas";
import type { LlmProviderSettings } from "@/types/settings";

const formSchema = providerSettingsSchema;
type FormValues = z.infer<typeof formSchema>;

export function ProviderSettingsForm({
  settings,
  onSave,
  onReset,
  isSaving,
}: {
  settings: LlmProviderSettings;
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

  function applyPreset(provider: string) {
    const preset = getProviderPreset(provider);
    form.reset(preset);
  }

  return (
    <form className="space-y-5 rounded-[28px] border bg-white/80 p-6 shadow-panel" onSubmit={form.handleSubmit(onSave)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Model Service</p>
        <h2 className="mt-2 text-2xl font-semibold">兼容 OpenAI 的模型服务配置</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          这里可以直接切换不同的兼容 OpenAI 的服务配置。现在内置了 SiliconFlow 和 MiniMax 两个预设，也支持你手动改成别的服务。
        </p>
      </div>

      <div className="space-y-3">
        <Label>快速预设</Label>
        <div className="flex flex-wrap gap-3">
          {getBuiltInProviders().map((provider) => (
            <Button
              key={provider}
              type="button"
              variant={form.watch("provider") === provider ? "default" : "outline"}
              onClick={() => applyPreset(provider)}
            >
              使用 {PROVIDER_LABELS[provider]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Input placeholder="例如：siliconflow 或 minimax" {...form.register("provider")} />
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <Input placeholder="例如：zai-org/GLM-5 或 MiniMax-M2.7" {...form.register("model")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Base URL</Label>
        <Input placeholder="https://api.siliconflow.cn/v1 或 https://api.minimaxi.com/v1" {...form.register("baseUrl")} />
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input type="password" placeholder="输入兼容 OpenAI 的 API Key" {...form.register("apiKey")} />
        </div>
        <div className="space-y-2">
          <Label>Temperature</Label>
          <Input type="number" step="0.1" min="0" max="2" {...form.register("temperature")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>说明</Label>
        <Textarea
          readOnly
          value="当前任务创建时，如果选择了公众号，会优先使用这里配置的模型服务进行真实生成；其他平台暂时仍使用 mock 内容。"
          className="min-h-24 bg-muted/40"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          保存配置
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置默认值
        </Button>
      </div>
    </form>
  );
}
