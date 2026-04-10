"use client";

import type { PlatformType } from "@/types/content";

import { PLATFORM_LABELS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function SettingsSidebar({
  value,
  onChange,
}: {
  value: PlatformType;
  onChange: (platform: PlatformType) => void;
}) {
  return (
    <aside className="rounded-[28px] border bg-white/80 p-4 shadow-panel">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Platforms</p>
      <div className="space-y-2">
        {(Object.keys(PLATFORM_LABELS) as PlatformType[]).map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => onChange(platform)}
            className={cn(
              "w-full rounded-2xl px-4 py-3 text-left transition",
              value === platform ? "bg-primary/10 text-primary" : "bg-card/70 hover:bg-muted",
            )}
          >
            {PLATFORM_LABELS[platform]}
          </button>
        ))}
      </div>
    </aside>
  );
}
