import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { resolveClerkUser } from "~/server/clerk-user";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await resolveClerkUser();
  if (!user) redirect("/login");

  redirect(user.isWaitlisted ? "/wait-list" : "/dashboard");
}
