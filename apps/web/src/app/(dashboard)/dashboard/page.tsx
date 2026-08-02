"use client";

import EmailChart from "./email-chart";
import DashboardFilters from "./dashboard-filters";
import { useUrlState } from "~/hooks/useUrlState";
import { ReputationMetrics } from "./reputation-metrics";
import { PageHeader } from "~/components/PageHeader";

export default function Dashboard() {
  const [days, setDays] = useUrlState("days", "30");
  const [domain, setDomain] = useUrlState("domain");

  return (
    <div className="w-full">
      <PageHeader
        title="Analytics"
        description="Sending volume, engagement, and reputation for your team."
      >
        <DashboardFilters
          days={days ?? "30"}
          setDays={setDays}
          domain={domain}
          setDomain={setDomain}
        />
      </PageHeader>
      <div className="space-y-8">
        <EmailChart days={Number(days ?? "30")} domain={domain} />
        <ReputationMetrics days={Number(days ?? "30")} domain={domain} />
      </div>
    </div>
  );
}
