import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "~/utils/session";
import { B2BSessionsAuthenticateResponse } from "stytch";
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
      const { session_jwt, member, organization } =
        await stytch.sessions.authenticate({
          session_duration_minutes: 30, // extend the session a bit
          session_jwt: session.data.session_jwt,
        });

      await session.update({ session_jwt: session_jwt });

      return {
        member: member,
        organization: organization,
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
        <h1>{data.organization.organization_name}</h1>
        <p>{data.organization.organization_slug}</p>
        <p>{data.organization.organization_id}</p>

        <h2>{data.member.email_address}</h2>
        <h2>{data.member.name}</h2>

        <hr />
        <Link to="/discovery/switch-organisation">Switch Organisation</Link>
      </div>
    </div>
  );
}
