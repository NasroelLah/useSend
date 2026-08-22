import { clerkClient, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";

import { env } from "~/env";
import { db } from "~/server/db";

function primaryVerifiedEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return null;

  const primary = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return primary?.verification?.status === "verified"
    ? primary.emailAddress.toLowerCase()
    : null;
}

export async function resolveClerkUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const linked = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });
  if (linked) return linked;

  const email = primaryVerifiedEmail(clerkUser);
  if (!email) {
    throw new Error("A verified primary email is required to use useSend");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            clerkUserId: clerkUser.id,
            name: name ?? existing.name,
            image: clerkUser.imageUrl || existing.image,
            emailVerified: existing.emailVerified ?? new Date(),
          },
        })
      : await tx.user.create({
          data: {
            clerkUserId: clerkUser.id,
            email,
            name,
            image: clerkUser.imageUrl,
            emailVerified: new Date(),
            isWaitlisted: env.NEXT_PUBLIC_IS_CLOUD,
          },
        });

    const membership = await tx.teamUser.findFirst({
      where: { userId: user.id },
    });

    if (!membership && !env.NEXT_PUBLIC_IS_CLOUD) {
      await tx.team.create({
        data: {
          name: name ? `${name}'s Team` : `${email.split("@")[0]}'s Team`,
          teamUsers: { create: { userId: user.id, role: "ADMIN" } },
        },
      });
    }

    return user;
  });
}

export async function syncClerkUserById(clerkUserId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const primary = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  if (!primary || primary.verification?.status !== "verified") return null;

  const email = primary.emailAddress.toLowerCase();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const existing = await db.user.findFirst({
    where: { OR: [{ clerkUserId }, { email }] },
  });

  return existing
    ? db.user.update({
        where: { id: existing.id },
        data: { clerkUserId, email, name, image: user.imageUrl },
      })
    : db.user.create({
        data: {
          clerkUserId,
          email,
          name,
          image: user.imageUrl,
          emailVerified: new Date(),
          isWaitlisted: env.NEXT_PUBLIC_IS_CLOUD,
        },
      });
}
