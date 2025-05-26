import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { MemberSession } from "stytch";
import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";

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

    let member_session: MemberSession | null = null;

    try {
      member_session = await stytch.sessions.authenticateJwtLocal({
        session_jwt: session.data.session_jwt,
        max_token_age_seconds: parseInt(process.env.MAX_TOKEN_AGE_SECONDS!),
      });
    } catch (err) {
      //
      console.log("JWT token local validation expired");
    }

    if (!member_session) {
      try {
        const authResult = await stytch.sessions.authenticate({
          session_jwt: session.data.session_jwt,
          session_duration_minutes: parseInt(process.env.SESSION_DURATION_MINUTES!),
        });

        member_session = authResult.member_session;

        await session.update({
          session_jwt: authResult.session_jwt,
        });
      } catch (err) {
        console.error("Could not find member by session token", err);
        throw redirect({ to: "/" });
      }
    }

    return {
      organization_id: member_session.organization_id,
      organisation_slug: data.organisationSlug,
      member_session: member_session,
    };
  });

export const Route = createFileRoute("/organisations/$organisationSlug/dashboard")({
  component: RouteComponent,
  loader: async ({ params: { organisationSlug } }) => await loader({ data: { organisationSlug } }),
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
