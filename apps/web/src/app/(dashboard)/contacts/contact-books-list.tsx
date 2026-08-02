"use client";

import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import DeleteContactBook from "./delete-contact-book";
import Link from "next/link";
import EditContactBook from "./edit-contact-book";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUrlState } from "~/hooks/useUrlState";
import { Input } from "@usesend/ui/src/input";
import { useDebouncedCallback } from "use-debounce";
import { BookUser } from "lucide-react";
import { Button } from "@usesend/ui/src/button";
import { Skeleton } from "@usesend/ui/src/skeleton";
import { EmptyState } from "~/components/EmptyState";

export default function ContactBooksList() {
  const [search, setSearch] = useUrlState("search");
  const contactBooksQuery = api.contacts.getContactBooks.useQuery({
    search: search ?? undefined,
  });

  const router = useRouter();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null);
  }, 400);

  return (
    <div className="mt-10">
      <Input
        // Remount when cleared programmatically so the visible text stays in
        // sync with the URL state.
        key={search ?? "empty"}
        placeholder="Search contact book"
        className="w-[300px] mr-4 mb-4"
        defaultValue={search ?? ""}
        onChange={(e) => debouncedSearch(e.target.value)}
        aria-label="Search contact books"
      />
      {contactBooksQuery.isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          aria-live="polite"
        >
          <span className="sr-only">Loading contact books</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>
      ) : contactBooksQuery.data?.length === 0 ? (
        <EmptyState
          icon={BookUser}
          title={search ? "No matching contact books" : "No contact books yet"}
          description={
            search
              ? `No contact book matches "${search}".`
              : "Create a contact book to group the subscribers you send campaigns to."
          }
          className="rounded-xl border border-dashed"
        >
          {search ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch(null)}
            >
              Clear search
            </Button>
          ) : null}
        </EmptyState>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ">
        {contactBooksQuery.data?.map((contactBook) => (
          <motion.div
            key={contactBook.id}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            whileTap={{ scale: 0.99 }}
            className="border rounded-xl shadow hover:shadow-lg"
          >
            <div className="flex flex-col">
              <Link href={`/contacts/${contactBook.id}`} key={contactBook.id}>
                <div className="flex justify-between items-center p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div>{contactBook.emoji}</div>
                    <div className="font-semibold truncate whitespace-nowrap overflow-ellipsis w-[180px]">
                      {contactBook.name}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-mono">
                      {contactBook._count.contacts}
                    </span>{" "}
                    contacts
                  </div>
                </div>
              </Link>

              <div className="flex justify-between items-center border-t  bg-muted/50">
                <div
                  className="text-muted-foreground text-xs cursor-pointer w-full py-3 pl-4"
                  onClick={() => router.push(`/contacts/${contactBook.id}`)}
                >
                  {formatDistanceToNow(contactBook.createdAt, {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex gap-3 pr-4">
                  <EditContactBook contactBook={contactBook} />
                  <DeleteContactBook contactBook={contactBook} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
