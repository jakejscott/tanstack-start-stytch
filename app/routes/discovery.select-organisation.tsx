import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { StytchError } from "stytch";
import { DiscoveredOrganizations, useStytch } from "@/lib/stytch";
import { useAppSession } from "@/lib/session";
import { useState } from "react";

export type CreateOrganisationData = {
  organisationName: string;
  organisationSlug: string;
};

function toDomain(email: string): string {
  return email.split("@")[1];
}

export const createOrganisation = createServerFn({ method: "POST" })
  .validator((data: CreateOrganisationData) => data)
  .handler(async (ctx) => {
    const session = await useAppSession();

    if (!session.data.intermediate_session_token) {
      throw new Error("No intermediate session");
      // console.log("No intermediate session, todo logout");
      // throw redirect({ to: "/" });
    }

    const stytch = useStytch();

    const { member, organization, session_jwt } =
      await stytch.discovery.organizations.create({
        intermediate_session_token: session.data.intermediate_session_token,
        email_allowed_domains: [],
        organization_name: ctx.data.organisationName,
        organization_slug: ctx.data.organisationName,
        session_duration_minutes: parseInt(
          process.env.SESSION_DURATION_MINUTES!
        ),
        mfa_policy: "OPTIONAL",
      });

    // Make the organization discoverable to other emails

    if (organization) {
      try {
        await stytch.organizations.update({
          organization_id: organization.organization_id,
          email_jit_provisioning: "RESTRICTED",
          sso_jit_provisioning: "ALL_ALLOWED",
          email_allowed_domains: [toDomain(member.email_address)],
        });
      } catch (e) {
        if (
          e instanceof StytchError &&
          e.error_type == "organization_settings_domain_too_common"
        ) {
          console.log(
            "User domain is common email provider, cannot link to organization"
          );
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
        console.log("session_jwt was empty");
        throw new Error("session_jwt was empty, probably needs MFA");
      }

      await session.clear();
      await session.update({
        session_jwt: session_jwt,
        email_address: member.email_address,
        organisation_id: organization.organization_id,
      });

      console.log("sending to dashboard", organization.organization_slug);

      throw redirect({
        to: "/organisations/$organisationSlug/dashboard",
        params: {
          organisationSlug: organization.organization_slug,
        },
      });
    }

    return {};
  });

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();

  if (!session.data.intermediate_session_token) {
    console.error("No intermediate session token was found");
    throw redirect({ to: "/" });
  }

  const stytch = useStytch();

  try {
    const { discovered_organizations } =
      await stytch.discovery.organizations.list({
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

type DiscoveredOrganizationsListProps = {
  discovered_organizations: DiscoveredOrganizations;
};

const DiscoveredOrganizationsList = ({
  discovered_organizations,
}: DiscoveredOrganizationsListProps) => {
  const formatMembership = ({
    membership,
    organization,
  }: Pick<DiscoveredOrganizations[0], "membership" | "organization">) => {
    if (membership?.type === "pending_member") {
      return `Join ${organization?.organization_name}`;
    }
    if (membership?.type === "eligible_to_join_by_email_domain") {
      return `Join ${organization?.organization_name}`;
    }
    if (membership?.type === "invited_member") {
      return `Accept invitation to ${organization?.organization_name}`;
    }
    return `Log into ${organization?.organization_name}`;
  };

  return (
    <div className="section">
      <h2>Select an Organization</h2>
      <p>Select the Organization that you&apos;d like to log into.</p>
      {discovered_organizations.length === 0 && (
        <p>No existing organizations.</p>
      )}
      <ul>
        {discovered_organizations.map(({ organization, membership }) => (
          <li key={organization!.organization_id}>
            <Link
              to={"/discovery/$organisationId"}
              params={{ organisationId: organization!.organization_id }}
            >
              <span>{formatMembership({ organization, membership })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Route = createFileRoute("/discovery/select-organisation")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const state = Route.useLoaderData();
  const createOrganisationMutation = useServerFn(createOrganisation);

  const [organisationName, setOrganisationName] = useState("");
  const [organisationSlug, setOrganisationSlug] = useState("");

  return (
    <div>
      <h1>Discovery flow Organization selection</h1>
      <DiscoveredOrganizationsList
        discovered_organizations={state.discovered_organizations}
      />

      <div>
        <div>
          <label htmlFor="organisationName">Organisation name</label>
        </div>
        <div>
          <input
            type="organisationName"
            name="organisationName"
            value={organisationName}
            onChange={(e) => {
              setOrganisationName(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="organisationSlug">Organisation slug</label>
        </div>
        <div>
          <input
            type="organisationSlug"
            name="organisationSlug"
            value={organisationSlug}
            onChange={(e) => {
              setOrganisationSlug(e.target.value);
            }}
          />
        </div>
        <div>
          <button
            type="submit"
            onClick={() => {
              createOrganisationMutation({
                data: {
                  organisationName: organisationName,
                  organisationSlug: organisationSlug,
                },
              });
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
