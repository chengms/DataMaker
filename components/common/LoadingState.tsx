import { LoaderCircle } from "lucide-react";

export function LoadingState({ title = "加载中...", description }: { title?: string; description?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/70 px-6 text-center">
      <LoaderCircle className="mb-4 size-8 animate-spin text-primary" />
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
