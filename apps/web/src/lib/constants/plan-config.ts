import type { Plan } from "@prisma/client";
import { PLAN_LIMITS } from "./plans";

export type PlanLimitConfig = {
  emailsPerMonth: number;
  emailsPerDay: number;
  domains: number;
  contactBooks: number;
  teamMembers: number;
  webhooks: number;
};

export type PlanDisplayConfig = {
  displayName: string;
  price: { monthly: number; currency: string };
  perks: string[];
  limits: PlanLimitConfig;
};

export type PlanConfig = Record<Plan, PlanDisplayConfig>;

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  FREE: {
    displayName: "Free",
    price: { monthly: 0, currency: "USD" },
    perks: [
      "Up to 3,000 emails / month",
      "100 emails / day",
      "1 sending domain",
      "1 contact book",
      "1 team member",
      "1 webhook",
    ],
    limits: PLAN_LIMITS.FREE,
  },
  BASIC: {
    displayName: "Basic",
    price: { monthly: 0, currency: "USD" },
    perks: [
      "Unlimited emails",
      "Unlimited domains",
      "Unlimited contact books",
      "Unlimited team members",
      "Unlimited webhooks",
    ],
    limits: PLAN_LIMITS.BASIC,
  },
};

/** Zod-compatible raw shape — used by the tRPC input validator in admin router. */
export const planLimitKeys = [
  "emailsPerMonth",
  "emailsPerDay",
  "domains",
  "contactBooks",
  "teamMembers",
  "webhooks",
] as const satisfies (keyof PlanLimitConfig)[];

export const LIMIT_LABELS: Record<keyof PlanLimitConfig, string> = {
  emailsPerMonth: "Emails / month",
  emailsPerDay: "Emails / day",
  domains: "Sending domains",
  contactBooks: "Contact books",
  teamMembers: "Team members",
  webhooks: "Webhooks",
};
