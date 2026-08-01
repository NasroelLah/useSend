/**
 * In-memory store for OTP tokens in development mode.
 * NextAuth hashes tokens before storing in DB, so we keep the original
 * here for the dev auto-fill feature.
 *
 * Stored on globalThis because Next.js dev mode creates separate module
 * instances per route — a module-level Map would not be shared between
 * the NextAuth route (which sets the OTP) and /api/dev/otp (which reads it).
 */

type OtpEntry = { token: string; expires: number };

const globalForOtp = globalThis as unknown as {
  __devOtpStore?: Map<string, OtpEntry>;
  __devOtpCleanupStarted?: boolean;
};

const otpStore = (globalForOtp.__devOtpStore ??= new Map<string, OtpEntry>());

// Clean up expired tokens every minute
if (!globalForOtp.__devOtpCleanupStarted && typeof setInterval !== "undefined") {
  globalForOtp.__devOtpCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpStore.entries()) {
      if (data.expires < now) {
        otpStore.delete(email);
      }
    }
  }, 60_000);
}

export function setOtp(email: string, token: string, expiresInMs = 10 * 60 * 1000) {
  otpStore.set(email.toLowerCase(), {
    token,
    expires: Date.now() + expiresInMs,
  });
}

export function getOtp(email: string): string | null {
  const data = otpStore.get(email.toLowerCase());
  if (!data) return null;
  if (data.expires < Date.now()) {
    otpStore.delete(email.toLowerCase());
    return null;
  }
  return data.token;
}
