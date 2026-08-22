import { DashboardProvider } from "~/providers/dashboard-provider";
import { DashboardLayout } from "./dashboard-layout";

export const dynamic = "force-dynamic";

export default function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
