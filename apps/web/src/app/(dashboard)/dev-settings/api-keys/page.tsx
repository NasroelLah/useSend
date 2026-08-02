"use client";

import AddApiKey from "./add-api-key";
import ApiList from "./api-list";
import { PageHeader } from "~/components/PageHeader";

export default function ApiKeysPage() {
  return (
    <div>
      <PageHeader
        title="API keys"
        description="Authenticate requests to the useSend API. Keys are shown once at creation."
      >
        <AddApiKey />
      </PageHeader>
      <ApiList />
    </div>
  );
}
