import {
  Gauge,
  Target,
  Microscope,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/score-ring";
import { QualificationPill } from "@/components/qualification-pill";
import { SectionLabel } from "@/components/section-label";
import { cn } from "@/lib/utils";
import type { LeadResponse } from "@/types/lead";

function ScoreCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  footer,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary";
  footer?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card
      variant={accent ? "default" : "default"}
      className={cn(
        "relative overflow-hidden p-5 group",
        accent && "ring-1 ring-primary/10",
      )}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100"
        />
      )}
      <div className="relative flex items-start gap-4">
        <ScoreRing value={value} size={64} thickness={6} />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Icon className="h-3 w-3" />
            {label}
          </div>
          {footer && <div className="mt-2">{footer}</div>}
        </div>
      </div>
    </Card>
  );
}

export function KpiCards({ data }: { data: LeadResponse }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
      <ScoreCard
        label="Lead Score"
        value={data.lead_score}
        icon={Gauge}
        accent
        footer={<QualificationPill qualification={data.qualification} />}
      />
      <ScoreCard
        label="ICP Fit"
        value={data.icp_fit_score}
        icon={Target}
        footer={
          <div className="text-[11px] text-muted-foreground">
            deterministic score
          </div>
        }
      />
      <ScoreCard
        label="Research Confidence"
        value={data.confidence_score}
        icon={Microscope}
        footer={
          <div className="text-[11px] text-muted-foreground">from homepage signals</div>
        }
      />
      <Card className="relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-muted/40 via-transparent to-transparent"
        />
        <div className="relative">
          <SectionLabel icon={Building2}>Company</SectionLabel>
          <div className="mt-2.5 font-display text-base font-semibold leading-snug text-balance">
            {data.company_type || "Unknown"}
          </div>
          {data.industry && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {data.industry}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
