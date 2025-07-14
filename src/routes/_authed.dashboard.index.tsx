import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { PageContent } from "@/components/page-content";
import { PageHeader } from "@/components/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sidebarOpen } = Route.useRouteContext();
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <PageHeader heading="Dashboard" />
        <PageContent>
          <SectionCards />
        </PageContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
