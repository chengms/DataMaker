"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ checked = false, onCheckedChange, disabled, className }: CheckboxProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex size-5 items-center justify-center rounded-md border border-input bg-card text-primary transition disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-primary bg-primary/10" : "",
        className,
      )}
    >
      {checked ? <Check className="size-4" /> : null}
    </button>
  );
}
