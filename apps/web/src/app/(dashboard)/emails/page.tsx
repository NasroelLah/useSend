"use client";

import EmailList from "./email-list";
import { PageHeader } from "~/components/PageHeader";

export default function EmailsPage() {
  return (
    <div>
      <PageHeader
        title="Emails"
        description="Every email sent from your team, with delivery status and engagement."
      />
      <EmailList />
    </div>
  );
}
