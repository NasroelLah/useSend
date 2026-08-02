import type { LucideIcon } from "lucide-react";
import { cn } from "@usesend/ui";

/**
 * Shared empty state. Replaces bare "No X found" text cells with an
 * icon + explanation + optional call to action, so the user knows
 * whether the list is genuinely empty or just filtered down to nothing.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action, e.g. "Clear filters" or "Add domain". */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-1 flex gap-2">{children}</div> : null}
    </div>
  );
}
