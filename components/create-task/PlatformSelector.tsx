"use client";

import type { PlatformType } from "@/types/content";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PLATFORM_OPTIONS } from "@/lib/platforms";

type PlatformSelectorProps = {
  value: PlatformType[];
  onChange: (next: PlatformType[]) => void;
};

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {PLATFORM_OPTIONS.map((platform) => {
        const checked = value.includes(platform.value);
        return (
          <button
            key={platform.value}
            type="button"
            onClick={() => {
              const next = checked
                ? value.filter((item) => item !== platform.value)
                : [...value, platform.value];
              onChange(next);
            }}
            className={cn(
              "rounded-2xl border bg-card/80 p-4 text-left transition hover:border-primary/40 hover:bg-white",
              checked ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{platform.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{platform.description}</p>
              </div>
              <Checkbox checked={checked} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
