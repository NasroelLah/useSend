"use client";

import { useUser } from "@clerk/nextjs";
import { FullScreenLoading } from "~/components/FullScreenLoading";
import { AddSesSettings } from "~/components/settings/AddSesSettings";
import CreateTeam from "~/components/team/CreateTeam";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { TeamProvider } from "./team-context";

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoaded } = useUser();
  const authContextQuery = api.team.getAuthContext.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });
  const isAdmin = authContextQuery.data?.isAdmin ?? false;
  const { data: teams, status } = api.team.getTeams.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });
  const { data: settings, status: settingsStatus } =
    api.admin.getSesSettings.useQuery(undefined, {
      enabled: isLoaded && !!user && (!env.NEXT_PUBLIC_IS_CLOUD || isAdmin),
    });

  if (
    !isLoaded ||
    authContextQuery.status === "pending" ||
    status === "pending" ||
    (settingsStatus === "pending" && !env.NEXT_PUBLIC_IS_CLOUD)
  ) {
    return <FullScreenLoading />;
  }

  if (
    settings?.length === 0 &&
    (!env.NEXT_PUBLIC_IS_CLOUD || isAdmin)
  ) {
    return <AddSesSettings />;
  }

  if (!teams || teams.length === 0) {
    return <CreateTeam />;
  }

  return <TeamProvider>{children}</TeamProvider>;
};
