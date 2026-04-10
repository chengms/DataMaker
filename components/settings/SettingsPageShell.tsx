"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { PlatformPromptForm } from "@/components/settings/PlatformPromptForm";
import { ProviderSettingsForm } from "@/components/settings/ProviderSettingsForm";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Button } from "@/components/ui/button";
import type { PlatformType } from "@/types/content";
import type { AppSettings, SettingsSection } from "@/types/settings";

export function SettingsPageShell({
  initialSettings,
  defaultSettings,
}: {
  initialSettings: AppSettings;
  defaultSettings: AppSettings;
}) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [activeSection, setActiveSection] = useState<SettingsSection>("provider");
  const [isSaving, setIsSaving] = useState(false);

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

  async function resetSection(section: SettingsSection) {
    const nextSettings =
      section === "provider"
        ? {
            ...settings,
            provider: defaultSettings.provider,
          }
        : {
            ...settings,
            [section]: defaultSettings[section],
          };

    setSettings(nextSettings);
    await saveAll(nextSettings);
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold">模型服务与平台 Prompt 设置</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              返回创作台
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SettingsSidebar value={activeSection} onChange={setActiveSection} />

          {activeSection === "provider" ? (
            <ProviderSettingsForm
              settings={settings.provider}
              isSaving={isSaving}
              onSave={(values) =>
                saveAll({
                  ...settings,
                  provider: values,
                })
              }
              onReset={() => void resetSection("provider")}
            />
          ) : (
            <PlatformPromptForm
              platform={activeSection as PlatformType}
              settings={settings[activeSection as PlatformType]}
              isSaving={isSaving}
              onSave={(values) =>
                saveAll({
                  ...settings,
                  [activeSection]: values,
                })
              }
              onReset={() => void resetSection(activeSection)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
