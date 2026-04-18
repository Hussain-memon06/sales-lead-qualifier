"use client";

import * as React from "react";
import { Settings2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ICP_PRESETS, ICP_PRESET_NAMES, EMPTY_ICP } from "@/lib/icp-presets";
import type { ICPProfile } from "@/types/lead";

type FieldKey = Exclude<keyof ICPProfile, "name">;

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  hint?: string;
}> = [
  { key: "target_industries", label: "Target Industries" },
  { key: "target_company_types", label: "Target Company Types" },
  { key: "target_geographies", label: "Target Geographies" },
  {
    key: "min_signals_of_budget",
    label: "Budget Signals",
    hint: "Signs the company can pay.",
  },
  { key: "preferred_business_models", label: "Preferred Business Models" },
  {
    key: "red_flags",
    label: "Red Flags",
    hint: "Traits that disqualify a lead.",
  },
];

export function IcpPanel({
  value,
  onChange,
}: {
  value: ICPProfile;
  onChange: (next: ICPProfile) => void;
}) {
  const presetName = value.name && ICP_PRESETS[value.name] ? value.name : "Custom";

  const handlePresetChange = (name: string) => {
    const preset = ICP_PRESETS[name] ?? EMPTY_ICP;
    onChange({ ...preset, name });
  };

  const updateField = (key: FieldKey, raw: string) => {
    const items = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    onChange({ ...value, [key]: items, name: "Custom" });
  };

  return (
    <Card className="h-fit sticky top-6">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/15 shrink-0">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Ideal Customer Profile</CardTitle>
            <CardDescription className="mt-1">
              Deterministic fit is scored against these criteria.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <Label>Preset</Label>
          </div>
          <Select value={presetName} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICP_PRESET_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <Label className="mb-1.5 block">{field.label}</Label>
              <Textarea
                value={value[field.key].join("\n")}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder="One item per line"
                rows={3}
                className="text-sm"
              />
              {field.hint && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {field.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
