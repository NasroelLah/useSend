import { getRedis, redisKey } from "../redis";
import {
  DEFAULT_PLAN_CONFIG,
  type PlanConfig,
} from "~/lib/constants/plan-config";
import { logger } from "../logger/log";

const PLAN_CONFIG_KEY = "plan:config";

/**
 * In-process memory cache so hot paths (email limit checks) don't hit Redis
 * on every call. Invalidated when an admin saves new config and when the
 * entry expires after MEM_TTL_MS.
 */
let memCache: { config: PlanConfig; expiresAt: number } | null = null;
const MEM_TTL_MS = 60_000; // 1 minute

export class PlanConfigService {
  /**
   * Returns the current plan config from memory cache → Redis → hardcoded
   * defaults, in that order.
   */
  static async getPlanConfig(): Promise<PlanConfig> {
    if (memCache && Date.now() < memCache.expiresAt) {
      return memCache.config;
    }

    try {
      const redis = getRedis();
      const raw = await redis.get(redisKey(PLAN_CONFIG_KEY));
      if (raw) {
        const parsed = JSON.parse(raw) as PlanConfig;
        memCache = { config: parsed, expiresAt: Date.now() + MEM_TTL_MS };
        return parsed;
      }
    } catch (err) {
      logger.warn({ err }, "[PlanConfigService] Failed to read plan config from Redis; using defaults");
    }

    return DEFAULT_PLAN_CONFIG;
  }

  /**
   * Persists the plan config to Redis (no TTL — config is permanent until
   * overwritten) and warms the in-memory cache.
   */
  static async setPlanConfig(config: PlanConfig): Promise<void> {
    const redis = getRedis();
    await redis.set(redisKey(PLAN_CONFIG_KEY), JSON.stringify(config));
    memCache = { config, expiresAt: Date.now() + MEM_TTL_MS };
    logger.info("[PlanConfigService] Plan config updated and cache warmed");
  }

  /** Force-expires the in-memory cache so the next read fetches from Redis. */
  static invalidateMemCache(): void {
    memCache = null;
  }
}
