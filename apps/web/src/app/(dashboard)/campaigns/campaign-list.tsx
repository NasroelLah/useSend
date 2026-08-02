"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useUrlState } from "~/hooks/useUrlState";
import { Button } from "@usesend/ui/src/button";
import { Skeleton } from "@usesend/ui/src/skeleton";
import { CampaignStatus } from "@prisma/client";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@usesend/ui/src/select";
import { Input } from "@usesend/ui/src/input";
import { Search, Megaphone } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import CampaignCard from "./campaign-card";
import { EmptyState } from "~/components/EmptyState";
import { DataPagination } from "~/components/DataPagination";

export default function CampaignList() {
  const [page, setPage] = useUrlState("page", "1");
  const [status, setStatus] = useUrlState("status");
  const [search, setSearch] = useUrlState("search");

  // Local mirror of the input so typing stays responsive. Previously both
  // `searchTerm` and `search` pointed at the same "search" URL key, so every
  // keystroke wrote the URL and the debounce below had no effect.
  const [searchTerm, setSearchTerm] = useState(search ?? "");

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null);
    setPage("1");
  }, 400);

  const onSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const pageNumber = Number(page);
  const hasFilters = Boolean(search || status);

  const campaignsQuery = api.campaign.getCampaigns.useQuery(
    {
      page: pageNumber,
      status: status as CampaignStatus | null,
      search,
    },
    {
      refetchInterval: (query) => {
        const c = query.state.data?.campaigns;
        if (!c) return false;
        const shouldPoll = c.some(
          (campaign) =>
            campaign.status === CampaignStatus.RUNNING ||
            campaign.status === CampaignStatus.SCHEDULED
        );
        return shouldPoll ? 5000 : false;
      },
    }
  );

  const totalCount = campaignsQuery.data?.totalCount ?? 0;

  return (
    <div className="mt-10 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* Search input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm || ""}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={status ?? "all"}
          onValueChange={(val) => setStatus(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-[180px] capitalize">
            {status ? status.toLowerCase() : "All statuses"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className=" capitalize">
              All statuses
            </SelectItem>
            <SelectItem value={CampaignStatus.DRAFT} className=" capitalize">
              Draft
            </SelectItem>
            <SelectItem
              value={CampaignStatus.SCHEDULED}
              className=" capitalize"
            >
              Scheduled
            </SelectItem>
            <SelectItem value={CampaignStatus.RUNNING} className=" capitalize">
              Running
            </SelectItem>
            <SelectItem value={CampaignStatus.PAUSED} className=" capitalize">
              Paused
            </SelectItem>
            <SelectItem value={CampaignStatus.SENT} className=" capitalize">
              Sent
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Campaign cards */}
      <div className="flex flex-col gap-8">
        {campaignsQuery.isLoading ? (
          <div className="flex flex-col gap-8" aria-live="polite">
            <span className="sr-only">Loading campaigns</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : campaignsQuery.data?.campaigns.length ? (
          campaignsQuery.data?.campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        ) : (
          <EmptyState
            icon={Megaphone}
            title={hasFilters ? "No matching campaigns" : "No campaigns yet"}
            description={
              hasFilters
                ? "No campaigns match the current search and filters."
                : "Create a campaign to send a broadcast to one of your contact books."
            }
            className="rounded-xl border border-dashed"
          >
            {hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSearch(null);
                  setStatus(null);
                  setPage("1");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </EmptyState>
        )}
      </div>
      {totalCount > 0 ? (
        <DataPagination
          page={pageNumber}
          limit={campaignsQuery.data?.limit ?? 30}
          totalCount={totalCount}
          isLoading={campaignsQuery.isLoading}
          onPageChange={(next) => setPage(next.toString())}
        />
      ) : null}
    </div>
  );
}
