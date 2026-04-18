"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultView } from "@/components/result/result-view";
import { ResultSkeleton } from "@/components/result/result-skeleton";
import { ErrorState } from "@/components/error-state";
import { api } from "@/services/api";
import type { LeadResponse } from "@/types/lead";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [data, setData] = React.useState<LeadResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getLead(id);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (Number.isFinite(id)) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/history">
            <ArrowLeft />
            Back to history
          </Link>
        </Button>
      </div>

      {loading && <ResultSkeleton />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && data && <ResultView data={data} />}
    </div>
  );
}
