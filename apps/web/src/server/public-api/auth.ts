import { Context } from "hono";
import { db } from "../db";
import { UnsendApiError } from "./api-error";
import { getTeamAndApiKey } from "../service/api-service";
import { isSelfHosted } from "~/utils/common";
import { logger } from "../logger/log";
import { getRedis, redisKey } from "../redis";

/**
 * Throttle lastUsed writes to at most one DB update per minute per API key.
 * A Redis marker (SET NX EX 60) gates the write; without this every API
 * request issues a DB write, which drains the connection pool under load.
 */
async function touchLastUsed(apiKeyId: number) {
  try {
    const redis = getRedis();
    const marker = redisKey(`apikey:lastused:${apiKeyId}`);
    const acquired = await redis.set(marker, "1", "EX", 60, "NX");
    if (!acquired) {
      return;
    }

    await db.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsed: new Date() },
    });
  } catch (err) {
    logger.error({ err }, "Failed to update lastUsed on API key");
  }
}

/**
 * Gets the team from the token. Also will check if the token is valid.
 */
export const getTeamFromToken = async (c: Context) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new UnsendApiError({
      code: "UNAUTHORIZED",
      message: "No Authorization header provided",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnsendApiError({
      code: "UNAUTHORIZED",
      message: "No Authorization header provided",
    });
  }

  const teamAndApiKey = await getTeamAndApiKey(token);

  if (!teamAndApiKey) {
    throw new UnsendApiError({
      code: "FORBIDDEN",
      message: "Invalid API token",
    });
  }

  const { team, apiKey } = teamAndApiKey;

  if (!team) {
    throw new UnsendApiError({
      code: "FORBIDDEN",
      message: "Invalid API token",
    });
  }

  // Fire-and-forget; throttled internally to one write per minute per key.
  void touchLastUsed(apiKey.id);

  return { ...team, apiKeyId: apiKey.id, apiKey: { domainId: apiKey.domainId } };
};
