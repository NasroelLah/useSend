import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@usesend/ui/src/tooltip";
import { Skeleton } from "@usesend/ui/src/skeleton";
import {
  CheckCircle2Icon,
  InfoIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  HARD_BOUNCE_RISK_RATE,
  HARD_BOUNCE_WARNING_RATE,
  COMPLAINED_WARNING_RATE,
  COMPLAINED_RISK_RATE,
} from "~/lib/constants";
import { api } from "~/trpc/react";

interface ReputationMetricsProps {
  days: number;
  domain: string | null;
}

enum ACCOUNT_STATUS {
  HEALTHY = "HEALTHY",
  WARNING = "WARNING",
  RISK = "RISK",
}

const getStatus = (
  value: number,
  warningAt: number,
  riskAt: number,
): ACCOUNT_STATUS =>
  value > riskAt
    ? ACCOUNT_STATUS.RISK
    : value > warningAt
      ? ACCOUNT_STATUS.WARNING
      : ACCOUNT_STATUS.HEALTHY;

export function ReputationMetrics({ days, domain }: ReputationMetricsProps) {
  const { data: metrics, isLoading } =
    api.dashboard.reputationMetricsData.useQuery({
      domain: domain ? Number(domain) : undefined,
    });

  const bounceStatus = getStatus(
    metrics?.bounceRate ?? 0,
    HARD_BOUNCE_WARNING_RATE,
    HARD_BOUNCE_RISK_RATE,
  );

  const complaintStatus = getStatus(
    metrics?.complaintRate ?? 0,
    COMPLAINED_WARNING_RATE,
    COMPLAINED_RISK_RATE,
  );

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
        <ReputationCard
          label="Bounce Rate"
          help="The percentage of emails sent from your account that resulted in a hard bounce."
          value={metrics?.bounceRate}
          status={bounceStatus}
          warningAt={HARD_BOUNCE_WARNING_RATE}
          riskAt={HARD_BOUNCE_RISK_RATE}
          scaleMax={HARD_BOUNCE_RISK_RATE * 1.5}
          isLoading={isLoading}
        />
        <ReputationCard
          label="Complaint Rate"
          help="The percentage of emails sent from your account that resulted in recipients reporting them as spam."
          value={metrics?.complaintRate}
          status={complaintStatus}
          warningAt={COMPLAINED_WARNING_RATE}
          riskAt={COMPLAINED_RISK_RATE}
          scaleMax={COMPLAINED_RISK_RATE * 1.5}
          isLoading={isLoading}
        />
      </div>
    </TooltipProvider>
  );
}

/**
 * A single rate against its warning/risk thresholds.
 *
 * Previously this was a `BarChart` with one 150px bar, which spent 200px of
 * vertical space to convey a single number. A horizontal threshold gauge shows
 * the same value plus its distance to the warning and risk lines far more directly.
 */
function ReputationCard({
  label,
  help,
  value,
  status,
  warningAt,
  riskAt,
  scaleMax,
  isLoading,
}: {
  label: string;
  help: string;
  value: number | undefined;
  status: ACCOUNT_STATUS;
  warningAt: number;
  riskAt: number;
  scaleMax: number;
  isLoading: boolean;
}) {
  const safeValue = value ?? 0;
  const toPercent = (n: number) =>
    `${Math.min(100, Math.max(0, (n / scaleMax) * 100))}%`;

  const fillClass =
    status === ACCOUNT_STATUS.HEALTHY
      ? "bg-success"
      : status === ACCOUNT_STATUS.WARNING
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:w-1/2">
      <div className="flex items-center gap-2">
        <h3 className="font-mono text-sm text-muted-foreground">{label}</h3>
        <Tooltip>
          <TooltipTrigger aria-label={`About ${label}`}>
            <InfoIcon
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </TooltipTrigger>
          <TooltipContent className="w-[300px]">{help}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-baseline gap-3">
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <span className="font-mono text-2xl tabular-nums">
              {safeValue.toFixed(2)}%
            </span>
            <StatusBadge status={status} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <Skeleton className="h-2.5 w-full" />
        ) : (
          <div
            className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-valuenow={Number(safeValue.toFixed(2))}
            aria-valuemin={0}
            aria-valuemax={scaleMax}
            aria-label={`${label} is ${safeValue.toFixed(2)} percent, status ${status.toLowerCase()}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${fillClass}`}
              style={{ width: toPercent(safeValue) }}
            />
            <span
              className="absolute top-0 h-full w-px bg-warning"
              style={{ left: toPercent(warningAt) }}
              aria-hidden="true"
            />
            <span
              className="absolute top-0 h-full w-px bg-destructive"
              style={{ left: toPercent(riskAt) }}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-px bg-warning"
              aria-hidden="true"
            />
            Warning {warningAt}%
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-px bg-destructive"
              aria-hidden="true"
            />
            Risk {riskAt}%
          </span>
        </div>
      </div>
    </div>
  );
}

export const StatusBadge: React.FC<{ status: ACCOUNT_STATUS }> = ({
  status,
}) => {
  const className =
    status === "HEALTHY"
      ? "text-success border-success"
      : status === "WARNING"
        ? "text-warning border-warning"
        : "text-destructive border-destructive";

  const StatusIcon =
    status === "HEALTHY"
      ? CheckCircle2Icon
      : status === "WARNING"
        ? TriangleAlertIcon
        : OctagonAlertIcon;

  return (
    <div
      className={`flex items-center gap-1 rounded-lg text-xs capitalize ${className}`}
    >
      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Reputation status: </span>
      {status.toLowerCase()}
    </div>
  );
};
