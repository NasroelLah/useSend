"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@usesend/ui/src/table";
import { api } from "~/trpc/react";
import { Download, MailSearch, Search } from "lucide-react";
import { formatDate } from "date-fns";
import { EmailStatus } from "@prisma/client";
import { EmailStatusBadge } from "./email-status-badge";
import EmailDetails from "./email-details";
import dynamic from "next/dynamic";
import { useUrlState } from "~/hooks/useUrlState";
import { Button } from "@usesend/ui/src/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@usesend/ui/src/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@usesend/ui/src/tooltip";
import { Input } from "@usesend/ui/src/input";
import { DEFAULT_QUERY_LIMIT } from "~/lib/constants";
import { useDebouncedCallback } from "use-debounce";
import { SheetTitle, SheetDescription } from "@usesend/ui/src/sheet";
import { EmptyState } from "~/components/EmptyState";
import { TableSkeleton } from "~/components/TableSkeleton";
import { DataPagination } from "~/components/DataPagination";
import { ActiveFilters, type ActiveFilter } from "~/components/ActiveFilters";

/* Stupid hydrating error. And I so stupid to understand the stupid NextJS docs */
const DynamicSheetWithNoSSR = dynamic(
  () => import("@usesend/ui/src/sheet").then((mod) => mod.Sheet),
  { ssr: false },
);

const DynamicSheetContentWithNoSSR = dynamic(
  () => import("@usesend/ui/src/sheet").then((mod) => mod.SheetContent),
  { ssr: false },
);

const EMAIL_STATUSES = [
  "SENT",
  "SCHEDULED",
  "QUEUED",
  "DELIVERED",
  "BOUNCED",
  "CLICKED",
  "OPENED",
  "DELIVERY_DELAYED",
  "COMPLAINED",
  "SUPPRESSED",
] as const;

const formatStatusLabel = (status: string) =>
  status.toLowerCase().replace(/_/g, " ");

export default function EmailsList() {
  const [selectedEmail, setSelectedEmail] = useUrlState("emailId");
  const [page, setPage] = useUrlState("page", "1");
  const [status, setStatus] = useUrlState("status");
  const [search, setSearch] = useUrlState("search");
  const [domain, setDomain] = useUrlState("domain");
  const [apiKey, setApiKey] = useUrlState("apikey");

  const pageNumber = Number(page);
  const domainId = domain ? Number(domain) : undefined;
  const apiId = apiKey ? Number(apiKey) : undefined;

  const emailsQuery = api.email.emails.useQuery({
    page: pageNumber,
    status: status?.toUpperCase() as EmailStatus,
    domain: domainId,
    search,
    apiId: apiId,
  });

  const exportQuery = api.email.exportEmails.useQuery(
    {
      status: status?.toUpperCase() as EmailStatus,
      domain: domainId,
      search,
      apiId: apiId,
    },
    { enabled: false },
  );

  const { data: domainsQuery } = api.domain.domains.useQuery();
  const { data: apiKeysQuery } = api.apiKey.getApiKeys.useQuery();

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmail(emailId);
  };

  const handleDomain = (val: string) => {
    setDomain(val === "All Domains" ? null : val);
    setPage("1");
  };

  const handleApiKey = (val: string) => {
    setApiKey(val === "All API Keys" ? null : val);
    setPage("1");
  };

  const handleStatus = (val: string) => {
    setStatus(val === "All statuses" ? null : val);
    setPage("1");
  };

  const handleSheetChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedEmail(null);
    }
  };

  // 300ms keeps typing responsive; the previous 1000ms felt unresponsive.
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null);
    setPage("1");
  }, 300);

  const clearAllFilters = () => {
    setStatus(null);
    setDomain(null);
    setApiKey(null);
    setSearch(null);
    setPage("1");
  };

  const activeFilters: ActiveFilter[] = [];
  if (search) {
    activeFilters.push({
      key: "search",
      label: "Search",
      value: search,
      onRemove: () => {
        setSearch(null);
        setPage("1");
      },
    });
  }
  if (status) {
    activeFilters.push({
      key: "status",
      label: "Status",
      value: formatStatusLabel(status),
      onRemove: () => {
        setStatus(null);
        setPage("1");
      },
    });
  }
  if (domain) {
    activeFilters.push({
      key: "domain",
      label: "Domain",
      value:
        domainsQuery?.find((d) => d.id === Number(domain))?.name ?? domain,
      onRemove: () => {
        setDomain(null);
        setPage("1");
      },
    });
  }
  if (apiKey) {
    activeFilters.push({
      key: "apikey",
      label: "API key",
      value:
        apiKeysQuery?.find((k) => k.id === Number(apiKey))?.name ?? apiKey,
      onRemove: () => {
        setApiKey(null);
        setPage("1");
      },
    });
  }

  const handleExport = async () => {
    try {
      const resp = await exportQuery.refetch();
      if (!resp.data) return;

      const escape = (val: unknown) => {
        const s = String(val ?? "");
        const startsRisky = /^\s*[=+\-@]/.test(s);
        const safe = (startsRisky ? "'" : "") + s.replace(/"/g, '""');
        return /[",\r\n]/.test(safe) ? `"${safe}"` : safe;
      };

      const header = [
        "To",
        "Status",
        "Subject",
        "Sent At",
        "Bounce Type",
        "Bounce Subtype",
        "Bounce Reason",
      ].join(",");
      const rows = resp.data.map((e) =>
        [
          e.to,
          e.status,
          e.subject,
          e.sentAt,
          e.bounceType,
          e.bounceSubType,
          e.bounceReason,
        ]
          .map(escape)
          .join(","),
      );
      const csv = [header, ...rows].join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emails-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const emails = emailsQuery.data?.emails;
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by subject or email"
            aria-label="Search emails by subject or recipient"
            className="w-full pl-9"
            defaultValue={search ?? ""}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
          <Select
            value={apiKey ?? "All API Keys"}
            onValueChange={handleApiKey}
          >
            <SelectTrigger
              className="w-full lg:w-[160px]"
              aria-label="Filter by API key"
            >
              {apiKey
                ? apiKeysQuery?.find((apikey) => apikey.id === Number(apiKey))
                    ?.name
                : "All API Keys"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All API Keys">All API Keys</SelectItem>
              {apiKeysQuery?.map((apikey) => (
                <SelectItem key={apikey.id} value={apikey.id.toString()}>
                  {apikey.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={domain ?? "All Domains"} onValueChange={handleDomain}>
            <SelectTrigger
              className="w-full lg:w-[160px]"
              aria-label="Filter by domain"
            >
              {domain
                ? domainsQuery?.find((d) => d.id === Number(domain))?.name
                : "All Domains"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Domains">All Domains</SelectItem>
              {domainsQuery?.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? "All statuses"}
            onValueChange={handleStatus}
          >
            <SelectTrigger
              className="w-full capitalize lg:w-[160px]"
              aria-label="Filter by status"
            >
              {status ? formatStatusLabel(status) : "All statuses"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All statuses">All statuses</SelectItem>
              {EMAIL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {formatStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportQuery.isFetching}
            className="w-full lg:w-auto"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <ActiveFilters filters={activeFilters} onClearAll={clearAllFilters} />

      <div className="flex flex-col overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted dark:bg-muted/70">
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Sent at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailsQuery.isLoading ? (
              <TableSkeleton
                columns={4}
                rows={8}
                columnWidths={[
                  "w-40",
                  "w-20",
                  "w-full max-w-[220px]",
                  "w-28 ml-auto",
                ]}
              />
            ) : emails?.length ? (
              emails.map((email) => (
                <TableRow
                  key={email.id}
                  onClick={() => handleSelectEmail(email.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectEmail(email.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for email to ${email.to} with subject ${email.subject}`}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <TableCell className="font-medium">{email.to}</TableCell>
                  <TableCell>
                    {email.latestStatus === "SCHEDULED" && email.scheduledAt ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <EmailStatusBadge
                              status={email.latestStatus ?? "Sent"}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            Scheduled at{" "}
                            {formatDate(
                              email.scheduledAt,
                              "MMM dd'th', hh:mm a",
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <EmailStatusBadge status={email.latestStatus ?? "Sent"} />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{email.subject}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {email.latestStatus !== "SCHEDULED"
                      ? formatDate(
                          email.scheduledAt ?? email.createdAt,
                          "MMM do, hh:mm a",
                        )
                      : "--"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={MailSearch}
                    title={hasFilters ? "No matching emails" : "No emails yet"}
                    description={
                      hasFilters
                        ? "No emails match the filters you applied. Try widening your search."
                        : "Emails you send through the API or a campaign will show up here."
                    }
                  >
                    {hasFilters ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <DynamicSheetWithNoSSR
          open={!!selectedEmail}
          onOpenChange={handleSheetChange}
        >
          <DynamicSheetContentWithNoSSR className="overflow-y-auto no-scrollbar sm:max-w-3xl">
            <SheetTitle className="sr-only">Email Details</SheetTitle>
            <SheetDescription className="sr-only">
              Detailed view of the selected email.
            </SheetDescription>
            {selectedEmail ? <EmailDetails emailId={selectedEmail} /> : null}
          </DynamicSheetContentWithNoSSR>
        </DynamicSheetWithNoSSR>
      </div>

      <DataPagination
        page={pageNumber}
        limit={emailsQuery.data?.limit ?? DEFAULT_QUERY_LIMIT}
        totalCount={emailsQuery.data?.totalCount ?? 0}
        onPageChange={(next) => setPage(next.toString())}
        isLoading={emailsQuery.isLoading}
      />
    </div>
  );
}
