"use client";

import { createContext, useContext, useCallback } from "react";
import { api } from "~/trpc/react";
import {
  getActiveTeamIdFromDocument,
  setActiveTeamIdCookie,
} from "~/utils/active-team";

// Define the Team type based on the Prisma schema
type Team = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  plan: "FREE" | "BASIC";
  stripeCustomerId?: string | null;
  billingEmail?: string | null;
};

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  isLoading: boolean;
  currentRole: "ADMIN" | "MEMBER";
  currentIsAdmin: boolean;
  setActiveTeam: (teamId: number) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: teams, status } = api.team.getTeams.useQuery();
  const utils = api.useUtils();

  // Resolve active team from cookie, falling back to the first team.
  // Keeps client and server (teamProcedure) on the same team.
  const activeTeamId =
    typeof window !== "undefined" ? getActiveTeamIdFromDocument() : null;
  const currentTeam =
    teams?.find((t) => t.id === activeTeamId) ?? teams?.[0] ?? null;

  const setActiveTeam = useCallback(
    (teamId: number) => {
      setActiveTeamIdCookie(teamId);
      // Invalidate everything so all team-scoped queries refetch
      // against the newly selected team.
      utils.invalidate();
    },
    [utils],
  );

  const value = {
    currentTeam,
    teams: teams || [],
    isLoading: status === "pending",
    currentRole: currentTeam?.teamUsers[0]?.role ?? "MEMBER",
    currentIsAdmin: currentTeam?.teamUsers[0]?.role === "ADMIN",
    setActiveTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
