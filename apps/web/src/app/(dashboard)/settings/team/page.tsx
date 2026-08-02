"use client";

import InviteTeamMember from "./invite-team-member";
import TeamMembersList from "./team-members-list";
import { PageHeader } from "~/components/PageHeader";

export default function TeamsPage() {
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
