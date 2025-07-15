import { AppSidebar } from "@/components/app-sidebar";
import { PageContent } from "@/components/page-content";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";
import { formatDate } from "@/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Check, Clock, Loader2, Mail, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InviteMemberForm = {
  email: string;
  role: string;
};

type DeleteMemberForm = {
  memberId: string;
};

export const inviteMemberFn = createServerFn({ method: "POST" })
  .validator((data: InviteMemberForm) => data)
  .handler(async (ctx) => {
    const session = await useAppSession();

    // TODO: Only stytch_admin should be able to invite as member.
    if (!ctx.data.email) {
      return { errorMessage: "Email is required" };
    }

    if (!ctx.data.role) {
      return { errorMessage: "Role is required" };
    }

    const roles: string[] = [];
    if (ctx.data.role == "stytch_admin") {
      roles.push(ctx.data.role);
    }

    try {
      const stytch = useStytch();
      await stytch.magicLinks.email.invite({
        email_address: ctx.data.email,
        organization_id: session.data.organisationId,
        roles: roles,
      });
    } catch (error) {
      console.log("Error sending invite", { error });
      return { errorMessage: "There was an error inviting user" };
    }

    return {};
  });

export const deleteMemberFn = createServerFn({ method: "POST" })
  .validator((data: DeleteMemberForm) => data)
  .handler(async (ctx) => {
    const session = await useAppSession();

    // TODO: Only stytch_admin should be able to delete a member.
    if (!ctx.data.memberId) {
      return { errorMessage: "Email is required" };
    }

    try {
      const stytch = useStytch();
      await stytch.organizations.members.delete({
        member_id: ctx.data.memberId,
        organization_id: session.data.organisationId,
      });
    } catch (error) {
      console.log("Error deleting member", { error });
      return { errorMessage: "There was an error deleting member" };
    }

    return {};
  });

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();
  const stytch = useStytch();

  const { members } = await stytch.organizations.members.search({
    organization_ids: [session.data.organisationId],
  });

  return {
    members: members,
    roles: [
      {
        role_id: "stytch_member",
        label: "Member",
      },
      {
        role_id: "stytch_admin",
        label: "Admin",
      },
    ],
  };
});

export const Route = createFileRoute("/_authed/dashboard/team")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const { sidebarOpen, organisations, organisationId } = Route.useRouteContext();
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar activeOrganisationId={organisationId} organisations={organisations} variant="inset" />
      <SidebarInset>
        <PageHeader heading="Team" />
        <PageContent>
          <div className="mx-auto flex flex-col gap-6 px-4 lg:px-6 pt-0 h-full w-full md:max-w-6xl">
            <InviteTeamMembers />
            <TeamMembers />
          </div>
        </PageContent>
      </SidebarInset>
    </SidebarProvider>
  );
}

function InviteTeamMembers() {
  const router = useRouter();
  const { roles } = Route.useLoaderData();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("stytch_member");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const inviteMember = useServerFn(inviteMemberFn);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("pending");
    try {
      var response = await inviteMember({
        data: {
          email: email,
          role: role,
        },
      });
      if (response.errorMessage) {
        setStatus("error");
        toast.error(response.errorMessage);
      } else {
        setStatus("success");
        toast.success("Invitation sent!", { description: `Invitation sent to ${email} with ${role} role.` });
        setRole("stytch_member");
        setEmail("");
        router.invalidate();
      }
    } catch (error) {
      setStatus("error");
      toast("There was an error sending the invitation");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invite Team Members
        </CardTitle>
        <CardDescription>Send invitations to new team members to join your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.role_id} value={role.role_id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto px-4 py-4" disabled={status == "pending"}>
            {status === "pending" && <Loader2 className="animate-spin" />}
            Send Invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const router = useRouter();
  const { members } = Route.useLoaderData();
  const invites = members.filter((x) => x.status == "invited");

  const deleteMember = useServerFn(deleteMemberFn);

  const handleDeleteMember = async ({ memberId, email }: { memberId: string; email: string }) => {
    try {
      var response = await deleteMember({
        data: {
          memberId: memberId,
        },
      });
      if (response.errorMessage) {
        toast.error(response.errorMessage);
      } else {
        toast.success("Member deleted", { description: `Member ${email} was deleted.` });
        router.invalidate();
      }
    } catch (error) {
      toast("There was an error deleting the member");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "invited":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Invited
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>Manage invitations that have been sent but not yet accepted.</CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending invitations</p>
            <p className="text-sm">Invitations you send will appear here.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((member) => (
                <TableRow key={member.member_id}>
                  <TableCell className="font-medium">{member.email_address}</TableCell>
                  <TableCell>
                    {member.roles.map((role) => {
                      return (
                        <Badge className="mr-2" key={role.role_id} variant="secondary">
                          {role.role_id}
                        </Badge>
                      );
                    })}
                  </TableCell>
                  <TableCell className="capitalize">{getStatusBadge(member.status)}</TableCell>
                  <TableCell>{formatDate(member.created_at!)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            await handleDeleteMember({
                              email: member.email_address,
                              memberId: member.member_id,
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
