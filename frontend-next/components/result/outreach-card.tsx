import { Mail, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { SectionLabel } from "@/components/section-label";

export function OutreachCard({ email }: { email: string }) {
  return (
    <Card variant="ink" className="relative overflow-hidden p-0 bg-noise">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent"
      />

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20 shrink-0">
              <Mail className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/85">
                <Sparkles className="h-3 w-3" />
                Outreach draft
              </div>
              <div className="mt-1 font-display text-lg font-semibold leading-tight text-primary-foreground">
                Ready to send
              </div>
              <div className="mt-1 text-[12px] text-primary-foreground/80">
                Tailored to the confirmed signals and ICP fit.
              </div>
            </div>
          </div>
          <CopyButton value={email} label="Copy" variant="ink-outline" />
        </div>

        <div className="mt-5 rounded-xl bg-black/20 ring-1 ring-primary-foreground/15 backdrop-blur-sm p-5">
          <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed text-primary-foreground">
            {email}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-primary-foreground/75">
          <span>Edit before sending — this is a starting point.</span>
          <span className="tabular-nums">{email.length} chars</span>
        </div>
      </div>
    </Card>
  );
}
