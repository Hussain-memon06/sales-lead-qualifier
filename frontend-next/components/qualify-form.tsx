"use client";

import * as React from "react";
import { Building2, Globe, Factory, StickyNote, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { ICPProfile, LeadResponse } from "@/types/lead";

export function QualifyForm({
  icp,
  onResult,
  onLoadingChange,
}: {
  icp: ICPProfile;
  onResult: (r: LeadResponse | null) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const [companyName, setCompanyName] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSubmitting(true);
    onLoadingChange(true);
    onResult(null);

    try {
      const result = await api.qualifyLead({
        company_name: companyName.trim(),
        website: website.trim(),
        industry: industry.trim(),
        notes: notes.trim(),
        icp,
      });
      onResult(result);
      toast.success(`${result.qualification} · Lead score ${result.lead_score}/100`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
      onResult(null);
    } finally {
      setSubmitting(false);
      onLoadingChange(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualify a Lead</CardTitle>
        <CardDescription>
          Enter lead details — research, scoring, and outreach are generated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="company_name" className="mb-1.5 block">
                <Building2 className="inline h-3 w-3 mr-1" />
                Company Name *
              </Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div>
              <Label htmlFor="website" className="mb-1.5 block">
                <Globe className="inline h-3 w-3 mr-1" />
                Website
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="industry" className="mb-1.5 block">
                <Factory className="inline h-3 w-3 mr-1" />
                Industry
              </Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS, Manufacturing"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes" className="mb-1.5 block">
                <StickyNote className="inline h-3 w-3 mr-1" />
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context: recent funding, engineering hires, market signals..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              {icp.name === "Custom" || !icp.name
                ? "Using your custom ICP."
                : `Scoring against the "${icp.name}" preset.`}
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              <Sparkles className={submitting ? "animate-pulse" : ""} />
              {submitting ? "Researching…" : "Qualify lead"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
