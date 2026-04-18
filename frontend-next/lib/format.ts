import type { Qualification } from "@/types/lead";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function qualificationTone(q: Qualification | string): {
  label: string;
  dot: string;
  ring: string;
  text: string;
} {
  switch (q) {
    case "Hot":
      return {
        label: "Hot",
        dot: "bg-hot",
        ring: "ring-hot/20",
        text: "text-hot",
      };
    case "Warm":
      return {
        label: "Warm",
        dot: "bg-warm",
        ring: "ring-warm/20",
        text: "text-warm",
      };
    default:
      return {
        label: "Cold",
        dot: "bg-cold",
        ring: "ring-cold/20",
        text: "text-cold",
      };
  }
}

export function compactText(text: string): string {
  if (!text) return "";
  return text.split(/\s+/).join(" ").trim();
}

export function extractBusinessModel(researchSummary: string): string {
  if (!researchSummary) return "";
  const marker = "Business model:";
  const idx = researchSummary.indexOf(marker);
  if (idx === -1) return "";
  return researchSummary.slice(idx + marker.length).trim();
}
