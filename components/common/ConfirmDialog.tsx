"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmText?: string;
  triggerLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  title,
  description,
  confirmText = "确认",
  triggerLabel,
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant === "destructive" ? "destructive" : "outline"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => void onConfirm()} variant={variant === "destructive" ? "destructive" : "default"}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
