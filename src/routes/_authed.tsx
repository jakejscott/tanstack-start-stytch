import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { MemberSession } from "stytch";

const authenticate = createServerFn().handler(async () => {
  const session = await useAppSession();

  if (!session.data.sessionJwt) {
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
    email: session.data.email,
    organisationId: session.data.organisationId,
    organisationName: session.data.organisationName,
    memberId: session.data.memberId,
  };
});

export const Route = createFileRoute("/_authed")({
  component: RouteComponent,
  async beforeLoad() {
    const data = await authenticate();
    return {
      ...data,
    };
  },
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
