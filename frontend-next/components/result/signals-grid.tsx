import { CheckCircle2, Eye, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/section-label";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "danger";

const TONE: Record<
  Tone,
  { chip: string; dot: string; ring: string; glow: string }
> = {
  success: {
    chip: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200/70",
    glow: "bg-emerald-400/10",
  },
  info: {
    chip: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    ring: "ring-sky-200/70",
    glow: "bg-sky-400/10",
  },
  danger: {
    chip: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-200/70",
    glow: "bg-rose-400/10",
  },
};

function SignalColumn({
  icon: Icon,
  title,
  subtitle,
  items,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  items: string[];
  tone: Tone;
}) {
  const t = TONE[tone];

  return (
    <Card className="relative h-full overflow-hidden p-6">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl",
          t.glow,
        )}
      />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
              t.chip,
              t.ring,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold leading-tight">
              {title}
            </div>
            <div className="text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold tabular-nums">
            {items.length}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {items.length === 1 ? "signal" : "signals"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
            None detected
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="flex items-start gap-2.5 rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    t.dot,
                  )}
                />
                <span className="text-foreground/85">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function SignalsGrid({
  confirmed,
  inferred,
  redFlags,
}: {
  confirmed: string[];
  inferred: string[];
  redFlags: string[];
}) {
  return (
    <div>
      <SectionLabel>Signal intelligence</SectionLabel>
      <div className="mt-3 grid gap-4 md:grid-cols-3 stagger">
        <SignalColumn
          icon={CheckCircle2}
          title="Confirmed"
          subtitle="Directly visible on the website"
          items={confirmed}
          tone="success"
        />
        <SignalColumn
          icon={Eye}
          title="Inferred"
          subtitle="From research, not explicitly stated"
          items={inferred}
          tone="info"
        />
        <SignalColumn
          icon={Flag}
          title="Red Flags"
          subtitle="Traits that disqualify this lead"
          items={redFlags}
          tone="danger"
        />
      </div>
    </div>
  );
}
