import { AlertTriangle, Lightbulb, BookOpen, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/section-label";
import type { LeadResponse } from "@/types/lead";

function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone: "warning" | "success";
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 px-3 py-3 text-xs text-muted-foreground">
        None listed.
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              tone === "warning" ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <span className="text-foreground/85">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NarrativeCard({ data }: { data: LeadResponse }) {
  return (
    <Card className="relative overflow-hidden p-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/5 to-transparent"
      />
      <div className="relative p-6 sm:p-8 space-y-7">
        <div>
          <SectionLabel icon={BookOpen}>Summary</SectionLabel>
          <p className="mt-3 text-[15.5px] leading-relaxed text-foreground/90 text-pretty">
            {data.company_summary}
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid gap-7 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-200/70">
                <AlertTriangle className="h-3 w-3" />
              </span>
              Pain Points
            </div>
            <BulletList items={data.pain_points} tone="warning" />
          </div>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 ring-1 ring-emerald-200/70">
                <Lightbulb className="h-3 w-3" />
              </span>
              Opportunities
            </div>
            <BulletList items={data.opportunities} tone="success" />
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <div>
          <SectionLabel icon={Sparkles}>Reasoning</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80 border-l-2 border-primary/30 pl-4">
            {data.reasoning}
          </p>
        </div>
      </div>
    </Card>
  );
}
