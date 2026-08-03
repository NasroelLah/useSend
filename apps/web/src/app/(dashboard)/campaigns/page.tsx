"use client";

import CampaignList from "./campaign-list";
import CreateCampaign from "./create-campaign";
import { PageHeader } from "~/components/PageHeader";

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Send bulk email to a contact book and track how it performed."
      >
        <CreateCampaign />
      </PageHeader>
      <CampaignList />
    </div>
  );
}
