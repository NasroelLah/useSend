import { DashboardProvider } from "~/providers/dashboard-provider";
import { NextAuthProvider } from "~/providers/next-auth";
import { DashboardLayout } from "./dashboard-layout";

export const dynamic = "force-static";

export default function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthProvider>
      <DashboardProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardProvider>
    </NextAuthProvider>
  );
}
