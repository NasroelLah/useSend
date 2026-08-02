"use client";

import AddContactBook from "./add-contact-book";
import ContactBooksList from "./contact-books-list";
import { PageHeader } from "~/components/PageHeader";

export default function ContactsPage() {
  return (
    <div>
      <PageHeader
        title="Contact books"
        description="Group your subscribers into lists you can send campaigns to."
      >
        <AddContactBook />
      </PageHeader>
      <ContactBooksList />
    </div>
  );
}
