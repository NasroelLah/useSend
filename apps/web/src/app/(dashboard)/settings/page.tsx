"use client";

import { isCloud } from "~/utils/common";
import UsagePage from "./usage/usage";
import InviteTeamMember from "./team/invite-team-member";
import TeamMembersList from "./team/team-members-list";
import { PageHeader } from "~/components/PageHeader";

export default function SettingsPage() {
  if (!isCloud()) {
    return (
      <div>
        <PageHeader
          as="h2"
          title="Team"
          description="Invite teammates and manage who can access this team."
        >
          <InviteTeamMember />
        </PageHeader>
        <TeamMembersList />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        as="h2"
        title="Usage"
        description="Your sending volume and limits for the current billing period."
      />
      <UsagePage />
    </div>
  );
}
