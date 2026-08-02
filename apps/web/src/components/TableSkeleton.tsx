import { Skeleton } from "@usesend/ui/src/skeleton";
import { TableCell, TableRow } from "@usesend/ui/src/table";

/**
 * Renders placeholder rows that match the real row height, so the table
 * does not collapse to a short spinner cell and then jump back open once
 * data arrives. Fixes the layout shift on every paginated list.
 */
export function TableSkeleton({
  rows = 8,
  columns,
  /**
   * Per-column width classes so the placeholder mirrors the real content
   * shape (e.g. a narrow status column vs a wide subject column).
   */
  columnWidths,
}: {
  rows?: number;
  columns: number;
  columnWidths?: string[];
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton
                className={`h-4 ${columnWidths?.[colIndex] ?? "w-full max-w-[180px]"}`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
      <TableRow className="sr-only">
        <TableCell colSpan={columns} aria-live="polite">
          Loading results
        </TableCell>
      </TableRow>
    </>
  );
}
