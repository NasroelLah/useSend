"use client";

import { Button } from "@usesend/ui/src/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination with a real total count.
 *
 * The previous implementation disabled "Next" when
 * `rows.length !== DEFAULT_QUERY_LIMIT`, which incorrectly disabled the button
 * whenever the last page happened to be exactly full, and gave the user no
 * sense of how much data existed. This derives page state from the total count.
 */
export function DataPagination({
  page,
  limit,
  totalCount,
  onPageChange,
  isLoading,
}: {
  page: number;
  limit: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p
        className="text-sm text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading ? (
          <span className="opacity-0">Loading</span>
        ) : totalCount === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{from}</span>
            {"–"}
            <span className="font-medium text-foreground">{to}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="px-1 text-sm tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
