import { H1, H2 } from "@usesend/ui";
import { cn } from "@usesend/ui";

/**
 * Shared page header used across all dashboard pages.
 *
 * Replaces the ad-hoc `<div className="flex justify-between items-center"><H1>…</H1></div>`
 * pattern that was duplicated on every page with inconsistent bottom margins.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
  as = "h1",
}: {
  title: string;
  description?: string;
  /** Primary actions rendered on the trailing edge (buttons, dialogs). */
  children?: React.ReactNode;
  className?: string;
  /**
   * Use "h2" when the page sits inside a tabbed layout that already renders
   * the route's `<h1>` (e.g. /settings, /admin). Keeps one h1 per document.
   */
  as?: "h1" | "h2";
}) {
  const Heading = as === "h1" ? H1 : H2;

  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <Heading className="text-balance">{title}</Heading>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      ) : null}
    </header>
  );
}
