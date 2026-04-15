"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DataAgentSettings } from "@/types/settings";

export function DataAgentSettingsForm({
  settings,
  isSaving,
  onSave,
  onReset,
}: {
  settings: DataAgentSettings;
  isSaving: boolean;
  onSave: (values: DataAgentSettings) => void;
  onReset: () => void;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);

  function handleSave() {
    if (enabled && !baseUrl.trim()) {
      toast.error("请输入 DataAgent 服务地址");
      return;
    }
    onSave({ enabled, baseUrl: baseUrl.trim() });
  }

  return (
    <div className="space-y-6 rounded-[28px] border bg-white/80 p-6 shadow-panel">
      <div>
        <h2 className="text-xl font-semibold">DataAgent 数据源</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          连接到 DataAgent 控制台，自动从选题中获取真实文章素材，用于创作参考。
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="data-agent-enabled" className="text-base font-medium">
              启用 DataAgent 数据源
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              开启后，创建任务时可从选题自动获取文章素材
            </p>
          </div>
          <Switch
            id="data-agent-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data-agent-url">DataAgent 服务地址</Label>
          <Input
            id="data-agent-url"
            placeholder="http://localhost:4010"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={!enabled}
          />
          <p className="text-xs text-muted-foreground">
            DataAgent 控制台服务地址，默认 http://localhost:4010
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存设置"}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
          重置为默认
        </Button>
      </div>
    </div>
  );
}
