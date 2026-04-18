import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
      <div className="text-destructive">{message}</div>
    </div>
  );
}
