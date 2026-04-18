import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Icon className="h-2.5 w-2.5" />
        </span>
      )}
      {children}
    </div>
  );
}
