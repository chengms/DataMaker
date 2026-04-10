import { Card, CardContent } from "@/components/ui/card";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/80 bg-white/85">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
