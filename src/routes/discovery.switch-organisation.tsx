import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DiscoveredOrganizations, useStytch } from "@/lib/stytch";
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

    return {
      discovered_organizations: discovered_organizations,
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
  discovered_organizations: DiscoveredOrganizations;
  organisation_id: string;
};

const OrgSwitcherList = ({ discovered_organizations, organisation_id }: OrgSwitcherListProps) => {
  return (
    <div className="section">
      <ul>
        {discovered_organizations.map(({ organization }) => (
          <li key={organization!.organization_id}>
            <Link to={"/discovery/$organisationId"} params={{ organisationId: organization!.organization_id }}>
              <span>{organization!.organization_name}</span>
              {organization!.organization_id === organisation_id && <span>&nbsp;(Active)</span>}
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
      <OrgSwitcherList discovered_organizations={data.discovered_organizations} organisation_id={data.organisationId} />
    </div>
  );
}
