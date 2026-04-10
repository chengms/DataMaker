"use client";

import type { PlatformType } from "@/types/content";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS } from "@/lib/platforms";

type PlatformTabsProps = {
  value: PlatformType;
  platforms: PlatformType[];
  onChange: (value: PlatformType) => void;
};

export function PlatformTabs({ value, platforms, onChange }: PlatformTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as PlatformType)}>
      <TabsList>
        {platforms.map((platform) => (
          <TabsTrigger key={platform} value={platform}>
            {PLATFORM_LABELS[platform]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
