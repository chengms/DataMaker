"use client";

import type { PlatformType } from "@/types/content";

import { Checkbox } from "@/components/ui/checkbox";
import { PLATFORM_OPTIONS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type PlatformSelectorProps = {
  value: PlatformType[];
  onChange: (next: PlatformType[]) => void;
  enabledPlatforms?: PlatformType[];
};

export function PlatformSelector({
  value,
  onChange,
  enabledPlatforms,
}: PlatformSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {PLATFORM_OPTIONS.map((platform) => {
        const checked = value.includes(platform.value);
        const isEnabled = enabledPlatforms ? enabledPlatforms.includes(platform.value) : true;

        return (
          <div
            key={platform.value}
            role="checkbox"
            aria-checked={checked}
            aria-disabled={!isEnabled}
            tabIndex={isEnabled ? 0 : -1}
            onClick={() => {
              if (!isEnabled) return;
              const next = checked
                ? value.filter((item) => item !== platform.value)
                : [...value, platform.value];
              onChange(next);
            }}
            onKeyDown={(event) => {
              if (!isEnabled) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              const next = checked
                ? value.filter((item) => item !== platform.value)
                : [...value, platform.value];
              onChange(next);
            }}
            className={cn(
              "rounded-2xl border bg-card/80 p-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              checked ? "border-primary bg-primary/5" : "border-border",
              isEnabled ? "hover:border-primary/40 hover:bg-white" : "cursor-not-allowed opacity-45",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{platform.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{platform.description}</p>
                {!isEnabled ? (
                  <p className="mt-2 text-xs font-medium text-muted-foreground">已在设置页关闭</p>
                ) : null}
              </div>
              <Checkbox checked={checked} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
