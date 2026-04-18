"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "surface-primary hover:brightness-[1.05] active:scale-[0.98] text-primary-foreground",
        outline:
          "border border-border bg-surface/80 backdrop-blur shadow-soft hover:bg-muted/40 hover:border-border-strong text-foreground",
        ghost:
          "hover:bg-muted/60 text-foreground",
        subtle:
          "bg-muted text-foreground hover:bg-muted/70 border border-transparent",
        ink:
          "surface-ink hover:brightness-110 active:scale-[0.98]",
        "ink-outline":
          "border border-primary-foreground/25 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground/40 backdrop-blur-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-11 px-6 text-[15px]",
        xl: "h-12 px-7 text-[15px] font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
