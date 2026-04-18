import { ExternalLink } from "lucide-react";
import type { LeadResponse } from "@/types/lead";
import { KpiCards } from "./kpi-cards";
import { ScoreBreakdown } from "./score-breakdown";
import { SignalsGrid } from "./signals-grid";
import { NarrativeCard } from "./narrative-card";
import { ResearchCard } from "./research-card";
import { OutreachCard } from "./outreach-card";
import { CompanyMark } from "@/components/company-mark";
import { QualificationPill } from "@/components/qualification-pill";
import { SectionLabel } from "@/components/section-label";

export function ResultView({ data }: { data: LeadResponse }) {
  const websiteHref = data.website
    ? data.website.startsWith("http")
      ? data.website
      : `https://${data.website}`
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 120% at 100% 0%, hsl(162 63% 42% / 0.12) 0%, transparent 55%), radial-gradient(40% 80% at 0% 100%, hsl(217 91% 60% / 0.06) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
        <div className="relative flex flex-col gap-6 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5 min-w-0">
            <CompanyMark name={data.company_name} size="xl" />
            <div className="min-w-0">
              <SectionLabel>Qualified lead</SectionLabel>
              <h1 className="mt-2 font-display text-hero font-semibold tracking-tight text-balance text-gradient-ink">
                {data.company_name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {data.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {data.industry && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{data.industry}</span>
                  </>
                )}
                {data.company_type && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{data.company_type}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <QualificationPill qualification={data.qualification} size="lg" />
          </div>
        </div>
      </section>

      <KpiCards data={data} />
      <ScoreBreakdown
        breakdown={data.icp_score_breakdown}
        reasoning={data.icp_fit_reasoning}
      />
      <SignalsGrid
        confirmed={data.confirmed_signals}
        inferred={data.inferred_signals}
        redFlags={data.red_flags_detected}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <NarrativeCard data={data} />
          <ResearchCard data={data} />
        </div>
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <OutreachCard email={data.outreach_email} />
          </div>
        </div>
      </div>
    </div>
  );
}
