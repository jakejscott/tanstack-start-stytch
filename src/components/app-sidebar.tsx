import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AudioWaveform, Command, GalleryVerticalEnd, Route } from "lucide-react";
import * as React from "react";
import { NavMain } from "./nav-main";
import { TeamSwitcher, TeamSwitcherTeam } from "./team-switcher";
import { DiscoveredOrganisation } from "@/lib/stytch";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

export type AppSidebarProps = {
  activeOrganisationId: string;
  organisations: Array<DiscoveredOrganisation>;
};

export function AppSidebar({
  activeOrganisationId,
  organisations,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const teams: TeamSwitcherTeam[] = organisations.map((org) => ({
    name: org.organisationName,
    plan: "Free",
    logo: Command,
    isActive: org.organisationId == activeOrganisationId,
    organisationId: org.organisationId,
  }));

  console.log("teams", teams);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <TeamSwitcher teams={teams} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
