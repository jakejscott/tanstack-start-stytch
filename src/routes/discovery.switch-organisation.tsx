import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DiscoveredOrganisation, useStytch } from "@/lib/stytch";
import { useAppSession } from "@/lib/session";

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();

  if (!session.data.sessionJwt) {
    // console.error("No intermediate session token was found");
    throw redirect({ to: "/" });
  }

  const stytch = useStytch();

  try {
    const { discovered_organizations } = await stytch.discovery.organizations.list({
      session_jwt: session.data.sessionJwt,
    });

    const organisations: DiscoveredOrganisation[] = discovered_organizations.map((item) => ({
      organisationId: item.organization!.organization_id,
      organisationName: item.organization!.organization_name,
      organisationSlug: item.organization!.organization_slug,
      membershipType: item.membership!.type,
      membershipMemberId: item.membership!.member!.member_id,
      membershipRoles: item.membership!.member!.roles.map((x) => x.role_id),
    }));

    return {
      organisations: organisations,
      organisationId: session.data.organisationId,
    };
  } catch (error) {
    // console.log("Something went wrong here", error);
    throw redirect({ to: "/" });
  }
});

export const Route = createFileRoute("/discovery/switch-organisation")({
  component: RouteComponent,
  loader: async () => await loader(),
});

type OrgSwitcherListProps = {
  organisationId: string;
  organisations: DiscoveredOrganisation[];
};

const OrgSwitcherList = (props: OrgSwitcherListProps) => {
  return (
    <div className="section">
      <ul>
        {props.organisations.map((organisation) => (
          <li key={organisation.organisationId}>
            <Link to={"/discovery/$organisationId"} params={{ organisationId: organisation.organisationId }}>
              <span>{organisation.organisationName}</span>
              {organisation.organisationId === props.organisationId && <span>&nbsp;(Active)</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <div>
      <h1>Switch Organisations</h1>
      <OrgSwitcherList organisations={data.organisations} organisationId={data.organisationId} />
    </div>
  );
}
