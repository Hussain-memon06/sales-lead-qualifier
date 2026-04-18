import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function hashHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 360;
  }
  return h;
}

export function CompanyMark({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sz = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-[13px]",
    lg: "h-14 w-14 text-base",
    xl: "h-16 w-16 text-lg",
  }[size];

  const hue = hashHue(name || "Lead");
  const style = {
    background: `linear-gradient(135deg, hsl(${hue} 55% 94%) 0%, hsl(${(hue + 40) % 360} 45% 88%) 100%)`,
    color: `hsl(${hue} 55% 25%)`,
    boxShadow: `inset 0 0 0 1px hsl(${hue} 45% 80% / 0.5)`,
  };

  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-center rounded-xl font-display font-semibold tracking-tight shrink-0",
        sz,
        className,
      )}
    >
      {initials(name) || "—"}
    </div>
  );
}
