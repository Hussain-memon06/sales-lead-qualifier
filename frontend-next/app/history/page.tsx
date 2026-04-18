"use client";

import * as React from "react";
import Link from "next/link";
import { History as HistoryIcon, RefreshCw, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { QualificationPill } from "@/components/qualification-pill";
import { api } from "@/services/api";
import { formatDateTime } from "@/lib/format";
import type { LeadSummary } from "@/types/lead";

export default function HistoryPage() {
  const [leads, setLeads] = React.useState<LeadSummary[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listLeads();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <PageHeader
        title="Lead history"
        description="Every lead you've qualified, newest first. Click through to see the full breakdown."
        action={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorState message={error} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
          <CardDescription>
            {leads && leads.length > 0
              ? `${leads.length} lead${leads.length === 1 ? "" : "s"} qualified`
              : "Saved leads appear here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : leads && leads.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={HistoryIcon}
                title="No leads yet"
                description="Qualify a lead from the dashboard — it'll show up here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>ICP Fit</TableHead>
                  <TableHead>Qualified</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads ?? []).map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {lead.company_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        #{lead.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.industry || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {lead.lead_score}
                    </TableCell>
                    <TableCell>
                      <QualificationPill qualification={lead.qualification} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {lead.icp_fit_score}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                        aria-label="View details"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
