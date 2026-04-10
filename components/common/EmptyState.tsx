import { FileText } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/70 px-6 text-center">
      <FileText className="mb-4 size-8 text-muted-foreground" />
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
