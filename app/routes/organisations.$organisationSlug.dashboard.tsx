import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "~/utils/session";
import { B2BSessionsAuthenticateResponse, B2BClient } from "stytch";
import loadStytch from "~/utils/loadStytch";

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

    const stytchClient = loadStytch();

    let sessionAuthRes: B2BSessionsAuthenticateResponse;
    try {
      // TODO: Check if we can call authenticateJwt here?
      sessionAuthRes = await stytchClient.sessions.authenticate({
        session_duration_minutes: 30, // extend the session a bit
        session_jwt: session.data.session_jwt,
      });
    } catch (err) {
      console.error("Could not find member by session token", err);
      throw redirect({ to: "/" });
    }

    await session.update({
      intermediate_session_token: undefined,
      session_jwt: sessionAuthRes.session_jwt,
      userEmail: sessionAuthRes.member.email_address,
    });

    return {
      member: sessionAuthRes.member,
      organisation: sessionAuthRes.organization,
    };
  });

export const Route = createFileRoute(
  "/organisations/$organisationSlug/dashboard"
)({
  component: RouteComponent,
  loader: async ({ params: { organisationSlug } }) =>
    await loader({ data: { organisationSlug } }),
});

function RouteComponent() {
  const router = useRouter();
  const state = Route.useLoaderData();
  return (
    <div>
      <div>
        <h1>{state.organisation.organization_name}</h1>
        <p>{state.organisation.organization_slug}</p>
        <p>{state.organisation.organization_id}</p>

        <h2>{state.member.email_address}</h2>
        <h2>{state.member.name}</h2>

        <hr />
        <Link to="/select-organisation">Select Organisation</Link>
      </div>
    </div>
  );
}
