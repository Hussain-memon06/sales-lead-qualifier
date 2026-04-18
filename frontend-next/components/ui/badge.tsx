import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary/10 text-primary",
        outline: "border-border bg-transparent text-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        success:
          "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200/60 bg-amber-50 text-amber-700",
        danger:
          "border-rose-200/60 bg-rose-50 text-rose-700",
        info:
          "border-sky-200/60 bg-sky-50 text-sky-700",
        ink:
          "border-transparent bg-foreground/90 text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
