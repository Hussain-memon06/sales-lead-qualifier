import { Flame, Thermometer, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Qualification } from "@/types/lead";

export function QualificationPill({
  qualification,
  size = "md",
  className,
}: {
  qualification: Qualification | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = {
    Hot: {
      icon: Flame,
      classes:
        "text-rose-700 bg-gradient-to-br from-rose-50 to-rose-100/70 ring-rose-200/80",
      glow: "shadow-[0_0_0_1px_hsl(356_75%_53%/0.15),0_8px_24px_-8px_hsl(356_75%_53%/0.35)]",
    },
    Warm: {
      icon: Thermometer,
      classes:
        "text-amber-700 bg-gradient-to-br from-amber-50 to-amber-100/70 ring-amber-200/80",
      glow: "shadow-[0_0_0_1px_hsl(32_95%_44%/0.15),0_8px_24px_-8px_hsl(32_95%_44%/0.30)]",
    },
    Cold: {
      icon: Snowflake,
      classes:
        "text-slate-700 bg-gradient-to-br from-slate-50 to-slate-100/70 ring-slate-200/80",
      glow: "shadow-[0_0_0_1px_hsl(215_20%_55%/0.12)]",
    },
  } as const;

  const entry =
    qualification === "Hot" || qualification === "Warm"
      ? meta[qualification]
      : meta.Cold;
  const Icon = entry.icon;

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] [&_svg]:h-2.5 [&_svg]:w-2.5 gap-1",
    md: "px-2.5 py-1 text-xs [&_svg]:h-3 [&_svg]:w-3 gap-1.5",
    lg: "px-3 py-1.5 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5 gap-2",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1",
        sizes,
        entry.classes,
        entry.glow,
        className,
      )}
    >
      <Icon />
      {qualification}
    </span>
  );
}
