import { Microscope, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/section-label";
import type { LeadResponse } from "@/types/lead";

export function ResearchCard({ data }: { data: LeadResponse }) {
  const hasAny =
    data.research_summary ||
    data.served_industries.length > 0 ||
    data.evidence_snippets.length > 0;

  if (!hasAny) return null;

  return (
    <Card className="relative overflow-hidden p-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 100% 0%, hsl(217 91% 60% / 0.05) 0%, transparent 60%)",
        }}
      />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0">
            <Microscope className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="min-w-0 pt-0.5">
            <SectionLabel>Research findings</SectionLabel>
            <div className="mt-1 font-display text-lg font-semibold leading-tight">
              What we learned from the homepage
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {data.research_summary && (
            <p className="text-[14.5px] leading-relaxed text-foreground/85">
              {data.research_summary}
            </p>
          )}

          {data.served_industries.length > 0 && (
            <div>
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Industries served
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.served_industries.map((ind) => (
                  <Badge key={ind} variant="muted">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.evidence_snippets.length > 0 && (
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Evidence from the website
              </div>
              <div className="space-y-2">
                {data.evidence_snippets.map((snippet, i) => (
                  <figure
                    key={i}
                    className="relative rounded-xl border border-border/80 bg-gradient-to-br from-muted/50 to-muted/20 px-4 py-3.5 pl-10"
                  >
                    <Quote className="absolute left-3.5 top-3.5 h-4 w-4 text-primary/40" />
                    <blockquote className="text-[13.5px] leading-relaxed italic text-foreground/80">
                      {snippet}
                    </blockquote>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
