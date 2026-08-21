import { headers } from "next/headers";
import { Webhook } from "svix";

import { env } from "~/env";
import { syncClerkUserById } from "~/server/clerk-user";
import { db } from "~/server/db";

type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: { id: string };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const headerList = await headers();
  const webhook = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);

  let event: ClerkWebhookEvent;
  try {
    event = webhook.verify(payload, {
      "svix-id": headerList.get("svix-id") ?? "",
      "svix-timestamp": headerList.get("svix-timestamp") ?? "",
      "svix-signature": headerList.get("svix-signature") ?? "",
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    await syncClerkUserById(event.data.id);
  }

  if (event.type === "user.deleted") {
    await db.user.updateMany({
      where: { clerkUserId: event.data.id },
      data: { clerkUserId: null },
    });
  }

  return Response.json({ received: true });
}
