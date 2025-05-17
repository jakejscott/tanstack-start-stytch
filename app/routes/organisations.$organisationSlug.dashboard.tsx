import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "~/utils/session";
import { useStytch } from "~/utils/stytch";

export type OrgType = {
  organisationSlug: string;
};

const loader = createServerFn()
  .validator((d: OrgType) => d)
  .handler(async ({ data }) => {
    const session = await useAppSession();

    if (!session.data.session_jwt) {
      console.error("No session_jwt");
      throw redirect({ to: "/" });
    }

    const stytch = useStytch();

    try {
      const { session_jwt, member_session } =
        await stytch.sessions.authenticateJwt({
          session_jwt: session.data.session_jwt,
        });

      await session.update({
        session_jwt: session_jwt,
      });

      return {
        organization_id: member_session.organization_id,
        organisation_slug: data.organisationSlug,
        member_session: member_session,
      };
    } catch (err) {
      console.error("Could not find member by session token", err);
      throw redirect({ to: "/" });
    }
  });

export const Route = createFileRoute(
  "/organisations/$organisationSlug/dashboard"
)({
  component: RouteComponent,
  loader: async ({ params: { organisationSlug } }) =>
    await loader({ data: { organisationSlug } }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <div>
      <div>
        <p>{data.organisation_slug}</p>
        <p>{data.organization_id}</p>
        <pre>{JSON.stringify(data.member_session, null, 2)}</pre>
        <hr />
        <p>
          <Link to="/discovery/switch-organisation">Switch Organisation</Link>
        </p>
        <p>
          <Link to="/logout">Logout</Link>
        </p>
      </div>
    </div>
  );
}
