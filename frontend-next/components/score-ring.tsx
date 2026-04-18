import { cn } from "@/lib/utils";

function strokeColor(value: number) {
  if (value >= 67) return "hsl(162 63% 40%)";
  if (value >= 45) return "hsl(32 95% 48%)";
  return "hsl(215 20% 62%)";
}

export function ScoreRing({
  value,
  max = 100,
  size = 96,
  thickness = 8,
  label,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor(value)}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-semibold tabular-nums leading-none"
          style={{ color: strokeColor(value), fontSize: size * 0.3 }}
        >
          {value}
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
