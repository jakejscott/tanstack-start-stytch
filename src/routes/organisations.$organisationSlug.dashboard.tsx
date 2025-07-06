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

    if (!session.data.sessionJwt) {
      // console.error("No session_jwt");
      throw redirect({ to: "/" });
    }

    const stytch = useStytch();

    let memberSession: MemberSession | null = null;
    try {
      memberSession = await stytch.sessions.authenticateJwtLocal({
        session_jwt: session.data.sessionJwt,
        max_token_age_seconds: parseInt(process.env.MAX_TOKEN_AGE_SECONDS!),
      });
    } catch (err) {
      // console.log("JWT token local validation expired");
    }

    if (!memberSession) {
      try {
        const authResult = await stytch.sessions.authenticate({
          session_jwt: session.data.sessionJwt,
          session_duration_minutes: parseInt(process.env.SESSION_DURATION_MINUTES!),
        });
        memberSession = authResult.member_session;
        await session.update({
          sessionJwt: authResult.session_jwt,
        });
      } catch (err) {
        // console.error("Could not find member by session token", err);
        throw redirect({ to: "/" });
      }
    }

    return {
      organizationId: memberSession.organization_id,
      organisationSlug: data.organisationSlug,
      memberSession: memberSession,
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
        <p>{data.organisationSlug}</p>
        <p>{data.organizationId}</p>
        <pre>{JSON.stringify(data.memberSession, null, 2)}</pre>
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
