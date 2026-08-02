import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@usesend/ui/src/breadcrumb";
import { cn } from "@usesend/ui";

export type Crumb = {
  label: string;
  /** Omit on the last crumb — it renders as the current page. */
  href?: string;
};

/**
 * Shared breadcrumb trail for nested routes.
 *
 * Collapses the ~12-line Breadcrumb/BreadcrumbList/BreadcrumbItem markup that
 * was hand-rolled in each detail page into a single declarative `items` prop.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="text-base">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href ?? item.label} className="inline-flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className={cn(isLast && "font-medium")}>
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator className="ml-1.5" />}
            </li>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
