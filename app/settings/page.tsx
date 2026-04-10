"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { PlatformPromptForm } from "@/components/settings/PlatformPromptForm";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Button } from "@/components/ui/button";
import { DEFAULT_APP_SETTINGS } from "@/lib/default-settings";
import type { PlatformType } from "@/types/content";
import type { AppSettings } from "@/types/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformType>("wechat");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("加载设置失败");
        }
        const data: AppSettings = await response.json();
        setSettings(data);
      } catch (error) {
        console.error(error);
        toast.error("设置加载失败");
      }
    }

    void load();
  }, []);

  async function saveAll(nextSettings: AppSettings) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      if (!response.ok) {
        throw new Error("保存失败");
      }
      const data: AppSettings = await response.json();
      setSettings(data);
      toast.success("设置已保存");
    } catch (error) {
      console.error(error);
      toast.error("保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  if (!settings) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">加载设置中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold">平台 Prompt 设置</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              返回创作台
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SettingsSidebar value={activePlatform} onChange={setActivePlatform} />
          <PlatformPromptForm
            platform={activePlatform}
            settings={settings[activePlatform]}
            isSaving={isSaving}
            onSave={(values) =>
              saveAll({
                ...settings,
                [activePlatform]: values,
              })
            }
            onReset={() =>
              setSettings({
                ...settings,
                [activePlatform]: DEFAULT_APP_SETTINGS[activePlatform],
              })
            }
          />
        </div>
      </div>
    </main>
  );
}
