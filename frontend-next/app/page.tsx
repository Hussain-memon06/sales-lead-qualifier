"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { IcpPanel } from "@/components/icp-panel";
import { QualifyForm } from "@/components/qualify-form";
import { ResultView } from "@/components/result/result-view";
import { ResultSkeleton } from "@/components/result/result-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ICP_PRESETS } from "@/lib/icp-presets";
import type { ICPProfile, LeadResponse } from "@/types/lead";

export default function DashboardPage() {
  const [icp, setIcp] = React.useState<ICPProfile>(
    ICP_PRESETS["B2B SaaS Agency"],
  );
  const [result, setResult] = React.useState<LeadResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <PageHeader
        title="Qualify a lead"
        description="Enter a company and let the agent research the website, score it against your ICP, and draft a personalized outreach email."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6 min-w-0">
          <QualifyForm
            icp={icp}
            onResult={setResult}
            onLoadingChange={setLoading}
          />

          {loading && <ResultSkeleton />}

          {!loading && result && <ResultView data={result} />}

          {!loading && !result && (
            <EmptyState
              icon={Sparkles}
              title="No lead qualified yet"
              description="Fill in a company name and hit Qualify — the result will appear here."
            />
          )}
        </div>

        <aside className="order-first xl:order-last">
          <IcpPanel value={icp} onChange={setIcp} />
        </aside>
      </div>
    </div>
  );
}
