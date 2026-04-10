"use client";

import type { SettingsSection } from "@/types/settings";

import { PLATFORM_LABELS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { PlatformType } from "@/types/content";

const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  provider: "模型服务",
  wechat: PLATFORM_LABELS.wechat,
  xiaohongshu: PLATFORM_LABELS.xiaohongshu,
  twitter: PLATFORM_LABELS.twitter,
  video_script: PLATFORM_LABELS.video_script,
};

export function SettingsSidebar({
  value,
  onChange,
}: {
  value: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const sections: SettingsSection[] = [
    "provider",
    ...(Object.keys(PLATFORM_LABELS) as PlatformType[]),
  ];

  return (
    <aside className="rounded-[28px] border bg-white/80 p-4 shadow-panel">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => onChange(section)}
            className={cn(
              "w-full rounded-2xl px-4 py-3 text-left transition",
              value === section ? "bg-primary/10 text-primary" : "bg-card/70 hover:bg-muted",
            )}
          >
            {SETTINGS_SECTION_LABELS[section]}
          </button>
        ))}
      </div>
    </aside>
  );
}
