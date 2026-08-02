import { createVerify, X509Certificate } from "crypto";
import { logger } from "~/server/logger/log";

/**
 * Verifies the authenticity of an SNS message by validating its signature
 * against the certificate referenced by SigningCertURL.
 *
 * Guards against:
 *  - Forged events (signature check)
 *  - SSRF via SigningCertURL / SubscribeURL (strict host allowlist)
 */

const SNS_CERT_HOST_PATTERN = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;

const certCache = new Map<string, Promise<string>>();

function assertSnsUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid SNS URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("SNS URL must use https");
  }

  if (!SNS_CERT_HOST_PATTERN.test(url.hostname)) {
    throw new Error(`Untrusted SNS host: ${url.hostname}`);
  }

  return url;
}

async function fetchCertificate(certUrl: string): Promise<string> {
  const cached = certCache.get(certUrl);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const url = assertSnsUrl(certUrl);
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SNS certificate: ${res.status}`);
    }
    return res.text();
  })();

  certCache.set(certUrl, promise);

  // Evict from cache on failure so a transient error isn't cached forever.
  promise.catch(() => certCache.delete(certUrl));

  return promise;
}

/**
 * Builds the canonical string-to-sign per the SNS message signature spec.
 * Field order and inclusion differ by message type.
 */
function buildStringToSign(message: Record<string, string>): string {
  const fields: string[] = [];

  const push = (name: string) => {
    const value = message[name];
    if (value !== undefined && value !== null) {
      fields.push(name, value);
    }
  };

  if (message.Type === "Notification") {
    push("Message");
    push("MessageId");
    if (message.Subject) {
      push("Subject");
    }
    push("Timestamp");
    push("TopicArn");
    push("Type");
  } else if (
    message.Type === "SubscriptionConfirmation" ||
    message.Type === "UnsubscribeConfirmation"
  ) {
    push("Message");
    push("MessageId");
    push("SubscribeURL");
    push("Timestamp");
    push("Token");
    push("TopicArn");
    push("Type");
  } else {
    throw new Error(`Unknown SNS message type: ${message.Type}`);
  }

  return fields.join("\n") + "\n";
}

/**
 * Returns true only when the message signature is valid.
 * Never throws — a verification failure means "not authentic".
 */
export async function verifySnsMessage(
  message: Record<string, string>
): Promise<boolean> {
  try {
    const { Signature, SigningCertURL, SignatureVersion } = message;

    if (!Signature || !SigningCertURL) {
      return false;
    }

    if (SignatureVersion !== "1") {
      logger.warn({ SignatureVersion }, "Unsupported SNS SignatureVersion");
      return false;
    }

    const certPem = await fetchCertificate(SigningCertURL);
    const cert = new X509Certificate(certPem);

    const verifier = createVerify("RSA-SHA1");
    verifier.update(buildStringToSign(message), "utf8");

    return verifier.verify(cert.publicKey, Signature, "base64");
  } catch (error) {
    logger.error({ err: error }, "SNS signature verification failed");
    return false;
  }
}

/**
 * Validates a SubscribeURL before fetching it, to prevent SSRF.
 * Returns the validated URL string, or throws.
 */
export function assertSafeSubscribeUrl(rawUrl: string): string {
  return assertSnsUrl(rawUrl).toString();
}
