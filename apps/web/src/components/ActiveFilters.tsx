"use client";

import { Button } from "@usesend/ui/src/button";
import { X } from "lucide-react";

export type ActiveFilter = {
  /** Stable key, used for the React key and the remove callback. */
  key: string;
  /** Short category name, e.g. "Status". */
  label: string;
  /** Human readable current value, e.g. "Delivered". */
  value: string;
  onRemove: () => void;
};

/**
 * Renders the currently applied filters as removable chips plus a
 * "Clear all" action. Without this, a filtered-empty list is
 * indistinguishable from a genuinely empty one.
 */
export function ActiveFilters({
  filters,
  onClearAll,
}: {
  filters: ActiveFilter[];
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Filters
      </span>
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={filter.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-md border bg-card py-1 pl-2.5 pr-1.5 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          <span className="font-medium text-foreground">{filter.value}</span>
          <X
            className="h-3 w-3 text-muted-foreground group-hover:text-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">
            Remove {filter.label} filter {filter.value}
          </span>
        </button>
      ))}
      {filters.length > 1 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
