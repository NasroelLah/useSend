import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { env } from "~/env";

/**
 * API keys are 128-bit random tokens (randomBytes(16)), not human passwords.
 * Key stretching (scrypt) is unnecessary for high-entropy tokens and blocks
 * the event loop. HMAC-SHA256 with a server-side pepper is the correct
 * primitive here: fast, and safe against offline brute-force of a leaked DB.
 *
 * Hash format: `hmac:<hex>` for new keys.
 * Legacy format: `<salt>:<hex>` (scrypt) is still accepted so existing keys
 * keep working; they are verified with the async-safe comparison below.
 */

const HMAC_PREFIX = "hmac:";

function getPepper(): string {
  // Dedicated secret preferred; fall back to NEXTAUTH_SECRET so existing
  // deployments without the new var keep working. NEXTAUTH_SECRET is
  // required in production; the dev-only optional case falls back to a
  // fixed non-secret value that is never used for real keys.
  return env.API_KEY_PEPPER ?? env.NEXTAUTH_SECRET ?? "usesend-dev-pepper";
}

function hmacSha256(data: string): Buffer {
  return createHmac("sha256", getPepper()).update(data, "utf8").digest();
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export const createSecureHash = async (key: string) => {
  return `${HMAC_PREFIX}${hmacSha256(key).toString("hex")}`;
};

export const verifySecureHash = async (key: string, hash: string) => {
  // New HMAC format
  if (hash.startsWith(HMAC_PREFIX)) {
    const stored = hash.slice(HMAC_PREFIX.length);
    const computed = hmacSha256(key).toString("hex");
    return safeEqualHex(stored, computed);
  }

  // Legacy scrypt format: `<salt>:<hex>`
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) {
    return false;
  }
  const data = new TextEncoder().encode(key);
  const derivedKey = scryptSync(data, salt, 64);
  return safeEqualHex(storedHash, derivedKey.toString("hex"));
};

export { randomBytes };
