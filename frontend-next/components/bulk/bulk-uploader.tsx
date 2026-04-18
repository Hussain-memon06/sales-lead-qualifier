"use client";

import * as React from "react";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  Download,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { QualificationPill } from "@/components/qualification-pill";
import { ErrorState } from "@/components/error-state";
import { api, ApiError } from "@/services/api";
import { extractBusinessModel, compactText } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ICPProfile, LeadResponse } from "@/types/lead";

interface CsvRow {
  company_name?: string;
  website?: string;
  industry?: string;
  notes?: string;
}

interface RowResult {
  company_name: string;
  website: string;
  status: "ok" | "error" | "skipped";
  error?: string;
  data?: LeadResponse;
}

const EXPORT_COLS = [
  "company_name",
  "website",
  "lead_score",
  "qualification",
  "icp_fit_score",
  "confidence_score",
  "company_summary",
  "business_model",
  "confirmed_signals",
  "inferred_signals",
  "red_flags_detected",
  "outreach_email_compact",
  "status",
  "error",
] as const;

function toExportRow(r: RowResult) {
  const d = r.data;
  return {
    company_name: r.company_name,
    website: r.website,
    lead_score: d?.lead_score ?? "",
    qualification: d?.qualification ?? "",
    icp_fit_score: d?.icp_fit_score ?? "",
    confidence_score: d?.confidence_score ?? "",
    company_summary: compactText(d?.company_summary ?? ""),
    business_model: extractBusinessModel(d?.research_summary ?? ""),
    confirmed_signals: (d?.confirmed_signals ?? []).join("; "),
    inferred_signals: (d?.inferred_signals ?? []).join("; "),
    red_flags_detected: (d?.red_flags_detected ?? []).join("; "),
    outreach_email_compact: compactText(d?.outreach_email ?? ""),
    status: r.status,
    error: r.error ?? "",
  };
}

export function BulkUploader({ icp }: { icp: ICPProfile }) {
  const [rows, setRows] = React.useState<CsvRow[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<RowResult[]>([]);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentlyQualifying, setCurrentlyQualifying] = React.useState<
    string | null
  >(null);

  const onFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);
    setResults([]);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.data.length) {
          setParseError("CSV is empty.");
          return;
        }
        const first = res.data[0];
        if (!("company_name" in first)) {
          setParseError(
            "Missing required column: company_name. Expected columns: company_name, website, industry, notes.",
          );
          setRows([]);
          return;
        }
        setRows(res.data as CsvRow[]);
      },
      error: (err) => {
        setParseError(`Could not parse CSV: ${err.message}`);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const reset = () => {
    setRows([]);
    setFileName(null);
    setResults([]);
    setParseError(null);
    setProgress(0);
    setCurrentlyQualifying(null);
  };

  const run = async () => {
    if (rows.length === 0) return;
    setRunning(true);
    setResults([]);
    setProgress(0);

    const out: RowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const companyName = (row.company_name ?? "").trim();
      setCurrentlyQualifying(companyName || "(blank)");

      if (!companyName) {
        out.push({
          company_name: "",
          website: (row.website ?? "").trim(),
          status: "skipped",
          error: "company_name is empty",
        });
      } else {
        try {
          const data = await api.qualifyLead({
            company_name: companyName,
            website: (row.website ?? "").trim(),
            industry: (row.industry ?? "").trim(),
            notes: (row.notes ?? "").trim(),
            icp,
          });
          out.push({
            company_name: companyName,
            website: (row.website ?? "").trim(),
            status: "ok",
            data,
          });
        } catch (err) {
          out.push({
            company_name: companyName,
            website: (row.website ?? "").trim(),
            status: "error",
            error:
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Unknown error",
          });
        }
      }

      setResults([...out]);
      setProgress(((i + 1) / rows.length) * 100);
    }

    setRunning(false);
    setCurrentlyQualifying(null);
    const ok = out.filter((r) => r.status === "ok").length;
    toast.success(
      `Processed ${out.length} rows — ${ok} qualified, ${out.length - ok} issues`,
    );
  };

  const downloadCsv = () => {
    const exportRows = results.map(toExportRow);
    const csv = Papa.unparse({
      fields: [...EXPORT_COLS],
      data: exportRows.map((r) =>
        EXPORT_COLS.map((c) => String(r[c as keyof typeof r] ?? "")),
      ),
    });
    // UTF-8 BOM so Excel renders non-ASCII characters correctly
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qualified_leads_${new Date()
      .toISOString()
      .replace(/[:T]/g, "-")
      .slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload a CSV</CardTitle>
          <CardDescription>
            Required column: <code className="rounded bg-muted px-1 py-0.5 text-xs">company_name</code>
            . Optional: <code className="rounded bg-muted px-1 py-0.5 text-xs">website</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">industry</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">notes</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!fileName ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-14 text-center cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15 mb-4">
                <UploadCloud className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-base font-semibold">
                Drop your CSV here
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {rows.length} row{rows.length === 1 ? "" : "s"} loaded
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={run}
                  disabled={running || rows.length === 0}
                  size="sm"
                >
                  <Play className="h-3.5 w-3.5" />
                  {running ? "Qualifying…" : `Qualify ${rows.length}`}
                </Button>
                <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
                  <X />
                </Button>
              </div>
            </div>
          )}

          {parseError && (
            <div className="mt-4">
              <ErrorState message={parseError} />
            </div>
          )}

          {running && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Qualifying: <span className="text-foreground font-medium">{currentlyQualifying}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription className="mt-1">
                <span className="inline-flex items-center gap-3">
                  <Badge variant="success">{okCount} qualified</Badge>
                  {errCount > 0 && <Badge variant="danger">{errCount} errors</Badge>}
                  {skippedCount > 0 && <Badge variant="muted">{skippedCount} skipped</Badge>}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setResults([])}>
                <RefreshCw />
                Clear
              </Button>
              <Button size="sm" onClick={downloadCsv} disabled={running}>
                <Download />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>ICP Fit</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{r.company_name || "—"}</div>
                      {r.website && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {r.website}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {r.data?.lead_score ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.data ? (
                        <QualificationPill qualification={r.data.qualification} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.data?.icp_fit_score ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.data?.confidence_score ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "ok"
                            ? "success"
                            : r.status === "error"
                              ? "danger"
                              : "muted"
                        }
                        className={cn(r.error && "cursor-help")}
                        title={r.error}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!running && results.length === 0 && !fileName && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No CSV uploaded yet"
          description="Upload a CSV of leads and we'll qualify each one using the same research + ICP pipeline."
        />
      )}
    </div>
  );
}
