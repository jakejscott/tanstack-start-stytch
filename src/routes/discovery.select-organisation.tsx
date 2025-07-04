import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSession } from "@/lib/session";
import { DiscoveredOrganizations, useStytch } from "@/lib/stytch";
import { cn, createSlug, toDomain } from "@/lib/utils";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Building2, GalleryVerticalEnd, Loader2 } from "lucide-react";
import { useState } from "react";
import { B2BDiscoveryOrganizationsCreateResponse, StytchError } from "stytch";
import { toast } from "sonner";

export type CreateOrganisationData = {
  organisationName?: string;
};

export const createOrganisation = createServerFn({ method: "POST" })
  .validator((data: CreateOrganisationData) => data)
  .handler(async (ctx) => {
    const session = await useAppSession();
    if (!session.data.intermediate_session_token) {
      throw new Error("No intermediate session");
    }

    if (!ctx.data.organisationName) {
      return {
        errorMessage: "Organisation name is required",
      };
    }

    if (!ctx.data.organisationName || ctx.data.organisationName.length <= 2) {
      return {
        errorMessage: "Organisation name must be at least two characters",
      };
    }

    const stytch = useStytch();
    const organisationSlug = createSlug(ctx.data.organisationName);

    let createResult: B2BDiscoveryOrganizationsCreateResponse;
    try {
      createResult = await stytch.discovery.organizations.create({
        intermediate_session_token: session.data.intermediate_session_token,
        email_allowed_domains: [],
        organization_name: ctx.data.organisationName,
        organization_slug: organisationSlug,
        session_duration_minutes: parseInt(process.env.SESSION_DURATION_MINUTES!),
        mfa_policy: "OPTIONAL",
      });
    } catch (e) {
      console.log("Error creating organisation", e);
      if (e instanceof StytchError) {
        // "error_type": "organization_slug_already_used",
        // "error_message": "The provided organization_slug is already used in another organization.",

        //
        // error_type: 'invalid_organization_slug',
        // error_message: "The organization_slug must be at least 2 characters long and may only contain alphanumerics and the reserved characters '-', '.', '_', or '~'. At least one character must be alphanumeric.",
        //

        if (e.error_type == "organization_slug_already_used") {
          return {
            errorMessage: "The provided organization name is already taken.",
          };
        }

        return {
          errorMessage: e.error_message,
        };
      } else {
        throw e;
      }
    }

    console.log("org create result", createResult);

    const { member, organization, session_jwt, intermediate_session_token, member_authenticated } = createResult;
    if (!organization) {
      throw new Error("Error creating organization");
    }

    // Make the organization discoverable to other emails
    try {
      await stytch.organizations.update({
        organization_id: organization.organization_id,
        email_jit_provisioning: "RESTRICTED",
        sso_jit_provisioning: "ALL_ALLOWED",
        email_allowed_domains: [toDomain(member.email_address)],
      });
    } catch (e) {
      if (e instanceof StytchError && e.error_type == "organization_settings_domain_too_common") {
        console.log("User domain is common email provider, cannot link to organization");
      } else {
        throw e;
      }
    }

    // Mark the first user in the organization as the admin
    await stytch.organizations.members.update({
      organization_id: organization.organization_id,
      member_id: member.member_id,
      trusted_metadata: { admin: true },
    });

    if (session_jwt === "") {
      console.log("session_jwt was empty, but intermediate_session_token was not");
      throw new Error("session_jwt was empty, probably needs MFA");
    }

    await session.clear();
    await session.update({
      session_jwt: session_jwt,
      email_address: member.email_address,
      organisation_id: organization.organization_id,
    });

    throw redirect({
      to: "/organisations/$organisationSlug/dashboard",
      params: {
        organisationSlug: organization.organization_slug,
      },
    });
  });

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();
  if (!session.data.intermediate_session_token) {
    console.error("No intermediate session token was found");
    throw redirect({ to: "/" });
  }

  const stytch = useStytch();

  try {
    const { discovered_organizations } = await stytch.discovery.organizations.list({
      intermediate_session_token: session.data.intermediate_session_token,
      session_jwt: undefined,
    });

    return {
      intermediate_session: session.data.intermediate_session_token,
      discovered_organizations: discovered_organizations,
    };
  } catch (error) {
    console.log("Something went wrong here", error);
    throw redirect({ to: "/" });
  }
});

export const Route = createFileRoute("/discovery/select-organisation")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const state = Route.useLoaderData();

  const [organisationName, setOrganisationName] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const _createOrganisation = useServerFn(createOrganisation);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("pending");
    try {
      var response = await _createOrganisation({ data: { organisationName: organisationName } });
      if (response.errorMessage) {
        setStatus("error");
        toast(response.errorMessage);
      } else {
        console.log("response success", response);
        setStatus("success");
      }
    } catch (error) {
      console.log("error creating organisation", error);
      setStatus("error");
      toast("There was an error creating the organisation");
    }
  };

  const formatAction = ({ membership }: Pick<DiscoveredOrganizations[0], "membership">) => {
    if (membership?.type === "pending_member") {
      return `Join`;
    }
    if (membership?.type === "eligible_to_join_by_email_domain") {
      return `Join`;
    }
    if (membership?.type === "invited_member") {
      return `Accept invitation`;
    }
    return `Select`;
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>

        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {state.discovered_organizations.length == 0 && <>Create Organization</>}
                {state.discovered_organizations.length > 0 && <>Select Organization</>}
              </CardTitle>
              <CardDescription>
                {state.discovered_organizations.length == 0 && (
                  <>Let's get started by creating your first organization.</>
                )}
                {state.discovered_organizations.length > 0 && (
                  <>Choose an organization to continue, or create a new one</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {state.discovered_organizations.length > 0 && (
                  <div className="space-y-2">
                    {state.discovered_organizations.map(({ organization, membership }) => (
                      <Link
                        to={"/discovery/$organisationId"}
                        params={{ organisationId: organization!.organization_id }}
                        key={organization!.organization_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{organization?.organization_name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="capitalize">
                                {membership!.member!.roles.map((x) => x.role_id).join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" className="cursor-pointer">
                          {formatAction({ membership: membership })}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}

                {state.discovered_organizations.length > 0 && (
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">Or create new organization</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="organisationName">Organization Name</Label>
                      <Input
                        id="organisationName"
                        type="text"
                        placeholder=""
                        value={organisationName}
                        disabled={status === "pending"}
                        onChange={(e) => {
                          setOrganisationName(e.target.value);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        You can always change this later in your organization settings.
                      </p>
                    </div>

                    <Button type="submit" className="w-full">
                      {status === "pending" && <Loader2 className="animate-spin" />}
                      Create Organisation
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
