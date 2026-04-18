import { cn } from "@/lib/utils";

export function HeroFrame({
  eyebrow,
  title,
  description,
  right,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated",
        className,
      )}
    >
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 120% at 100% 0%, hsl(162 63% 42% / 0.10) 0%, transparent 55%), radial-gradient(40% 80% at 0% 100%, hsl(217 91% 60% / 0.06) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
        <div className="max-w-2xl">
          {eyebrow && <div className="mb-4">{eyebrow}</div>}
          <h1 className="font-display text-hero font-semibold text-balance text-gradient-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-pretty max-w-xl">
              {description}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </section>
  );
}
