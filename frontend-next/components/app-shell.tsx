"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Upload,
  Clock,
  Target,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Qualify", icon: LayoutGrid, description: "Score a single lead" },
  { href: "/bulk", label: "Bulk upload", icon: Upload, description: "CSV batch qualify" },
  { href: "/history", label: "History", icon: Clock, description: "All qualified leads" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex relative">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[272px] shrink-0 flex-col border-r border-border/70 sticky top-0 h-screen"
        style={{
          background:
            "linear-gradient(180deg, hsl(40 33% 98%) 0%, hsl(40 30% 97%) 100%)",
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-border/60">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl surface-primary">
                <Target className="h-[18px] w-[18px]" />
              </div>
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-primary/20 animate-glow-pulse"
              />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-semibold tracking-tight">
                Qualifier
              </div>
              <div className="text-[11px] text-muted-foreground">
                Sales intelligence
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            Workspace
          </div>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-surface shadow-soft border border-border/80 text-foreground"
                    : "text-muted-foreground hover:bg-surface/60 hover:text-foreground border border-transparent",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">
                  <span className="block leading-tight">{item.label}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground/80 leading-tight mt-0.5">
                    {item.description}
                  </span>
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer card */}
        <div className="p-3">
          <div className="surface-ink relative overflow-hidden rounded-xl p-4 bg-noise">
            <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/25 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/85">
                <Sparkles className="h-3 w-3" />
                Why it's fast
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-primary-foreground">
                ICP fit is scored deterministically in Python. Only the
                narrative runs through the LLM.
              </p>
              <Link
                href="/history"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary-foreground/90 hover:text-primary-foreground underline-offset-4 hover:underline"
              >
                View past runs
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 border-b border-border/60 bg-surface/90 backdrop-blur-xl px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg surface-primary">
            <Target className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold">Qualifier</span>
        </Link>
        <div className="flex items-center gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
