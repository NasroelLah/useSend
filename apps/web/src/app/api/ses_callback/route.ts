import { env } from "~/env";
import { db } from "~/server/db";
import { logger } from "~/server/logger/log";
import { SesHookParser } from "~/server/service/ses-hook-parser";
import { SesSettingsService } from "~/server/service/ses-settings-service";
import {
  assertSafeSubscribeUrl,
  verifySnsMessage,
} from "~/server/service/sns-verifier";
import { SnsNotificationMessage } from "~/types/aws-types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: "Hello" });
}

export async function POST(req: Request) {
  const data = await req.json();

  const isEventValid = await checkEventValidity(data);

  if (!isEventValid) {
    logger.warn({ type: data?.Type }, "Rejected invalid SNS event");
    return Response.json({ data: "Event is not valid" }, { status: 403 });
  }

  if (data.Type === "SubscriptionConfirmation") {
    return handleSubscription(data);
  }

  try {
    const message = JSON.parse(data.Message || "{}");
    const status = await SesHookParser.queue({
      event: message,
      messageId: data.MessageId,
    });
    if (!status) {
      return Response.json({ data: "Error in parsing hook" });
    }

    return Response.json({ data: "Success" });
  } catch (e) {
    logger.error({ err: e }, "Error parsing SES hook");
    return Response.json({ data: "Error is parsing hook" });
  }
}

/**
 * Handles the subscription confirmation event. called only once for a webhook
 */
async function handleSubscription(message: any) {
  let subscribeUrl: string;
  try {
    subscribeUrl = assertSafeSubscribeUrl(message.SubscribeURL);
  } catch (e) {
    logger.warn({ err: e }, "Rejected unsafe SubscribeURL");
    return Response.json({ data: "Invalid SubscribeURL" }, { status: 400 });
  }

  await fetch(subscribeUrl, {
    method: "GET",
    signal: AbortSignal.timeout(5000),
  });

  const topicArn = message.TopicArn as string;
  const setting = await db.sesSetting.findFirst({
    where: {
      topicArn,
    },
  });

  if (!setting) {
    return Response.json({ data: "Setting not found" });
  }

  await db.sesSetting.update({
    where: {
      id: setting?.id,
    },
    data: {
      callbackSuccess: true,
    },
  });

  SesSettingsService.invalidateCache();

  return Response.json({ data: "Success" });
}

/**
 * Verifies the SNS message signature, then confirms the topic is one we
 * configured. In development the signature check is skipped so local
 * testing with hand-crafted payloads still works.
 */
async function checkEventValidity(message: SnsNotificationMessage) {
  if (env.NODE_ENV !== "development") {
    const authentic = await verifySnsMessage(
      message as unknown as Record<string, string>
    );
    if (!authentic) {
      return false;
    }
  }

  const { TopicArn } = message;
  const configuredTopicArn = await SesSettingsService.getTopicArns();

  if (!configuredTopicArn.includes(TopicArn)) {
    return false;
  }

  return true;
}
