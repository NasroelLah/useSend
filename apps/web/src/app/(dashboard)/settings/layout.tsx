"use client";

import { useTeam } from "~/providers/team-context";
import { SettingsNavButton } from "../dev-settings/settings-nav-button";
import { isCloud } from "~/utils/common";
import { H1 } from "@usesend/ui";
import { api } from "~/trpc/react";

export const dynamic = "force-static";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentIsAdmin } = useTeam();

  // Only fetch BYOS status when the user is a team admin (gate matches the
  // procedure's own auth gate, so non-admins never trigger a 401 here).
  const byosStatusQuery = api.team.getByosStatus.useQuery(undefined, {
    enabled: currentIsAdmin && isCloud(),
  });

  const showByosTab =
    currentIsAdmin && isCloud() && (byosStatusQuery.data?.allowByos ?? false);

  return (
    <div>
      <H1>Settings</H1>
      <div className="flex gap-4 mt-4">
        {isCloud() ? (
          <SettingsNavButton href="/settings">Usage</SettingsNavButton>
        ) : null}
        {currentIsAdmin && isCloud() ? (
          <SettingsNavButton href="/settings/billing">
            Billing
          </SettingsNavButton>
        ) : null}
        <SettingsNavButton href="/settings/team">Team</SettingsNavButton>
        {showByosTab ? (
          <SettingsNavButton href="/settings/ses">
            Custom SES
          </SettingsNavButton>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
