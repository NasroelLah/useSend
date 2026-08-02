"use client";

import { useState } from "react";
import AddSuppressionDialog from "./add-suppression";
import BulkAddSuppressionsDialog from "./bulk-add-suppressions";
import SuppressionList from "./suppression-list";
import SuppressionStats from "./suppression-stats";
import { Button } from "@usesend/ui/src/button";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "~/components/PageHeader";

export default function SuppressionsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);

  return (
    <div>
      <PageHeader
        title="Suppression list"
        description="Addresses excluded from sending after a hard bounce or complaint."
      >
        <Button variant="outline" onClick={() => setShowBulkAddDialog(true)}>
          <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
          Bulk Add
        </Button>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Suppression
        </Button>
      </PageHeader>

      <SuppressionStats />

      {/* Suppression List */}
      <SuppressionList />

      {/* Dialogs */}
      <AddSuppressionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <BulkAddSuppressionsDialog
        open={showBulkAddDialog}
        onOpenChange={setShowBulkAddDialog}
      />
    </div>
  );
}
