"use client";

import DomainsList from "./domain-list";
import AddDomain from "./add-domain";
import { PageHeader } from "~/components/PageHeader";

export default function DomainsPage() {
  return (
    <div>
      <PageHeader
        title="Domains"
        description="Verify the domains you send from so your email reaches the inbox."
      >
        <AddDomain />
      </PageHeader>
      <DomainsList />
    </div>
  );
}
