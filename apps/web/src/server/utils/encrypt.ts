/**
 * AES-256-GCM symmetric encryption using NEXTAUTH_SECRET as the key.
 *
 * Ciphertext format (all base64url-encoded, joined with "."):
 *   <iv>.<ciphertext>.<authTag>
 *
 * The 256-bit key is derived from NEXTAUTH_SECRET with SHA-256 so any
 * secret length works without extra key-management overhead.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";
import { env } from "~/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const TAG_BYTES = 16;

function getDerivedKey(): Buffer {
  const secret = env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set — cannot derive encryption key");
  }
  return createHash("sha256").update(secret).digest(); // 32 bytes = 256 bits
}

export function encrypt(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }
  const [ivB64, dataB64, tagB64] = parts as [string, string, string];

  const key = getDerivedKey();
  const iv = Buffer.from(ivB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");

  if (tag.length !== TAG_BYTES) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
