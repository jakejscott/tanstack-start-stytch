import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import React from "react";
import { StytchError } from "stytch";
import loadStytch, { DiscoveredOrganizations } from "~/utils/loadStytch";
import { useAppSession } from "~/utils/session";

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
      throw redirect({ to: "/" });
    }

    console.log("organisation name:", ctx.data.organisationName);

    const stytchClient = loadStytch();

    const { member, organization, session_jwt, intermediate_session_token } =
      await stytchClient.discovery.organizations.create({
        intermediate_session_token: session.data.intermediate_session_token,
        email_allowed_domains: [],
        organization_name: ctx.data.organisationName,
        organization_slug: ctx.data.organisationName,
        session_duration_minutes: 60,
        mfa_policy: "OPTIONAL",
      });

    // Make the organization discoverable to other emails

    if (organization) {
      try {
        await stytchClient.organizations.update({
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
      await stytchClient.organizations.members.update({
        organization_id: organization.organization_id,
        member_id: member.member_id,
        trusted_metadata: { admin: true },
      });

      if (session_jwt === "") {
        console.log("session_jwt was empty");
        throw new Error("session_jwt was empty, probably needs MFA");
      }

      console.log("setting session");

      await session.update({
        intermediate_session_token: undefined,
        session_jwt: session_jwt,
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

  if (!session.data.intermediate_session_token && !session.data.session_jwt) {
    console.error("No intermediate session token was found");
    throw redirect({ to: "/" });
  }

  const stytchClient = loadStytch();

  try {
    const { discovered_organizations } =
      await stytchClient.discovery.organizations.list({
        intermediate_session_token: session.data.intermediate_session_token,
        session_jwt: session.data.session_jwt,
      });

    return {
      intermediate_session: session.data.intermediate_session_token,
      discovered_organizations: discovered_organizations,
    };
  } catch (error) {
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

export const Route = createFileRoute("/select-organisation")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const router = useRouter();
  const state = Route.useLoaderData();

  const createOrganisationMutation = useServerFn(createOrganisation);

  const [organisationName, setOrganisationName] = React.useState("");
  const [organisationSlug, setOrganisationSlug] = React.useState("");

  return (
    <div>
      <h1>Discovery flow Organization selection</h1>
      <p>
        Now that you've successfully authenticated, we surface a list of
        Organizations that you have access to. This list includes Organizations
        that you've already joined, have been invited to, or are eligible to
        join through JIT provisioning based on your email domain (as long as
        there's at least one other active Member in the Organization with the
        same email domain).
      </p>
      <p>
        Once you select an Organization, we'll exchange the
        `intermediate_session_token` that was returned during the Discovery flow
        for a `session_token` specific to the Organization that you select.
      </p>

      {/* <pre>
        {JSON.stringify(
          { discovered_organizations: state.discovered_organizations },
          null,
          2
        )}
      </pre> */}

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
