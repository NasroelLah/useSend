"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@usesend/ui/src/table";
import { api } from "~/trpc/react";
import { useUrlState } from "~/hooks/useUrlState";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { EmptyState } from "~/components/EmptyState";
import { TableSkeleton } from "~/components/TableSkeleton";
import { DataPagination } from "~/components/DataPagination";
// import DeleteCampaign from "./delete-campaign";
import Link from "next/link";
// import DuplicateCampaign from "./duplicate-campaign";

import { TextWithCopyButton } from "@usesend/ui/src/text-with-copy";
import DeleteTemplate from "./delete-template";
import DuplicateTemplate from "./duplicate-template";

export default function TemplateList() {
  const [page, setPage] = useUrlState("page", "1");

  const pageNumber = Number(page);

  const templateQuery = api.template.getTemplates.useQuery({
    page: pageNumber,
  });

  const totalCount = templateQuery.data?.totalCount ?? 0;

  return (
    <div className="mt-10 flex flex-col gap-4">
      <div className="flex flex-col rounded-xl border border-border shadow">
        <Table className="">
          <TableHeader className="">
            <TableRow className=" bg-muted/30">
              <TableHead className="rounded-tl-xl">Name</TableHead>
              <TableHead className="">ID</TableHead>
              <TableHead className="">Created At</TableHead>
              <TableHead className="rounded-tr-xl">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templateQuery.isLoading ? (
              <TableSkeleton
                columns={4}
                columnWidths={["w-40", "w-[200px]", "w-24", "w-16"]}
              />
            ) : templateQuery.data?.templates.length ? (
              templateQuery.data?.templates.map((template) => (
                <TableRow key={template.id} className="">
                  <TableCell className="font-medium">
                    <Link
                      className="underline underline-offset-4 decoration-dashed text-foreground hover:text-foreground"
                      href={`/templates/${template.id}/edit`}
                    >
                      {template.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TextWithCopyButton
                      value={template.id}
                      className="w-[200px] overflow-hidden"
                    />
                  </TableCell>
                  <TableCell className="">
                    {formatDistanceToNow(new Date(template.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <DuplicateTemplate template={template} />
                      <DeleteTemplate template={template} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="No templates yet"
                    description="Create a reusable template to send consistent emails without rewriting the content each time."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalCount > 0 ? (
        <DataPagination
          page={pageNumber}
          limit={templateQuery.data?.limit ?? 10}
          totalCount={totalCount}
          isLoading={templateQuery.isLoading}
          onPageChange={(next) => setPage(next.toString())}
        />
      ) : null}
    </div>
  );
}
