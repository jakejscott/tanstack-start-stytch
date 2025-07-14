import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { IconDashboard, IconUsers } from "@tabler/icons-react";
import { Link, linkOptions, useMatchRoute } from "@tanstack/react-router";

const options = linkOptions([
  {
    to: "/dashboard",
    label: "Dashboard",
    activeOptions: { exact: true },
    icon: IconDashboard,
  },
  {
    to: "/dashboard/team",
    label: "Team",
    icon: IconUsers,
  },
]);

export function NavMain() {
  const matchRoute = useMatchRoute();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {options.map((option) => {
            const active = matchRoute({ to: option.to }) != false;
            return (
              <SidebarMenuItem key={option.to}>
                <SidebarMenuButton tooltip={option.label} isActive={active} asChild>
                  <Link {...option} key={option.to}>
                    <option.icon />
                    <span>{option.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
