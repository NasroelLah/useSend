"use client";

import TemplateList from "./template-list";
import CreateTemplate from "./create-template";
import { PageHeader } from "~/components/PageHeader";

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Templates"
        description="Reusable email designs you can send from the API or a campaign."
      >
        <CreateTemplate />
      </PageHeader>
      <TemplateList />
    </div>
  );
}
