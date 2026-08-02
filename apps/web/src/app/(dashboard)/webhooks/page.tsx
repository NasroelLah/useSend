"use client";

import { AddWebhook } from "./add-webhook";
import { WebhookList } from "./webhook-list";
import { PageHeader } from "~/components/PageHeader";

export default function WebhooksPage() {
  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Receive email events at your own endpoint as they happen."
      >
        <AddWebhook />
      </PageHeader>
      <WebhookList />
    </div>
  );
}
