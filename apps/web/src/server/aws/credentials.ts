import { env } from "~/env";
import { decrypt } from "~/server/utils/encrypt";
import { db } from "~/server/db";

/** Platform-level AWS credentials (from environment variables). */
export function getAwsCredentialOptions() {
  const hasKey = !!env.AWS_ACCESS_KEY_ID;
  const hasSecret = !!env.AWS_SECRET_ACCESS_KEY;

  if (hasKey !== hasSecret) {
    throw new Error(
      "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must both be set or both be omitted"
    );
  }

  if (hasKey) {
    return {
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    };
  }
  return {};
}

export type AwsCredentialOptions =
  | { credentials: { accessKeyId: string; secretAccessKey: string } }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  | {};

/**
 * Resolves AWS credentials for a team.
 *
 * If the team has BYOS credentials configured, decrypts and returns them.
 * Falls back to platform-level credentials otherwise.
 *
 * Returns `{ credentials, region }` where `region` is the BYOS region when
 * configured, or `undefined` (caller uses its own default).
 */
export async function getAwsCredentialOptionsForTeam(teamId: number): Promise<{
  credentialOptions: AwsCredentialOptions;
  byosRegion: string | null;
}> {
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { byosAccessKeyId: true, byosSecretKey: true, byosRegion: true },
  });

  if (team?.byosAccessKeyId && team?.byosSecretKey) {
    try {
      const accessKeyId = decrypt(team.byosAccessKeyId);
      const secretAccessKey = decrypt(team.byosSecretKey);
      return {
        credentialOptions: { credentials: { accessKeyId, secretAccessKey } },
        byosRegion: team.byosRegion ?? null,
      };
    } catch {
      // Corrupted ciphertext — fall through to platform credentials
    }
  }

  return {
    credentialOptions: getAwsCredentialOptions(),
    byosRegion: null,
  };
}
