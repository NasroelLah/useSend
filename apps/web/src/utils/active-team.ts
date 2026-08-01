/**
 * Active team selection shared between server (tRPC context) and client.
 * Stored in a plain cookie so both sides can read it and tRPC requests
 * (same-origin fetch) send it automatically.
 */

export const ACTIVE_TEAM_COOKIE = "usesend-active-team";

function parseActiveTeamId(cookieHeader: string | null): number | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ACTIVE_TEAM_COOKIE}=`));
  if (!match) return null;
  const value = Number(match.split("=")[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** Server-side: read active team id from request headers. */
export function getActiveTeamIdFromHeaders(headers: Headers): number | null {
  return parseActiveTeamId(headers.get("cookie"));
}

/** Client-side: read active team id from document.cookie. */
export function getActiveTeamIdFromDocument(): number | null {
  if (typeof document === "undefined") return null;
  return parseActiveTeamId(document.cookie);
}

/** Client-side: persist active team id. */
export function setActiveTeamIdCookie(teamId: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACTIVE_TEAM_COOKIE}=${teamId}; path=/; max-age=31536000; samesite=lax`;
}
