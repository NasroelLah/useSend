import JoinTeam from "~/components/team/JoinTeam";
import { Suspense } from "react";
import Spinner from "@usesend/ui/src/spinner";
import { resolveClerkUser } from "~/server/clerk-user";
import { redirect } from "next/navigation";

export default async function CreateTeam({
  searchParams,
}: {
  searchParams: Promise<{ inviteId?: string }>;
}) {
  const user = await resolveClerkUser();
  const params = await searchParams;

  if (!user) {
    const inviteId = params?.inviteId;
    const next = `/join-team${inviteId ? `?inviteId=${encodeURIComponent(inviteId)}` : ""}`;
    redirect(`/login?redirect_url=${encodeURIComponent(next)}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className=" w-[300px] flex flex-col gap-8">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <Spinner className="h-5 w-5" innerSvgClass="stroke-primary" />
            </div>
          }
        >
          <JoinTeam />
        </Suspense>
      </div>
    </div>
  );
}
