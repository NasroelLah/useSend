/**
 * In-memory store for OTP tokens in development mode.
 * NextAuth hashes tokens before storing in DB, so we keep the original
 * here for the dev auto-fill feature.
 */

const otpStore = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens every minute
if (typeof setInterval !== "undefined") {
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
