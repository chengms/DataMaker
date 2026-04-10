"use client";

import type { TwitterMode } from "@/types/content";

import { cn } from "@/lib/utils";
import { TWITTER_MODE_LABELS } from "@/lib/platforms";

type TwitterModeSelectorProps = {
  value?: TwitterMode;
  onChange: (value: TwitterMode) => void;
};

export function TwitterModeSelector({ value, onChange }: TwitterModeSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(["single", "thread"] as TwitterMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-2xl border px-4 py-3 text-left transition",
            value === mode ? "border-primary bg-primary/5" : "border-border bg-card/80",
          )}
        >
          <p className="font-medium">{TWITTER_MODE_LABELS[mode]}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "single" ? "适合短观点、快速发帖" : "适合连续论述、拆分多条内容"}
          </p>
        </button>
      ))}
    </div>
  );
}
