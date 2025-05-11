import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import loadStytch from "~/utils/loadStytch";
import { useAppSession } from "~/utils/session";

export type OrgId = {
  organisationId: string;
};

const loader = createServerFn()
  .validator((d: OrgId) => d)
  .handler(async ({ data }) => {
    const session = await useAppSession();
    const stytchClient = loadStytch();

    console.log("session data", session.data);

    if (session.data.intermediate_session_token || session.data.session_jwt) {
      console.log("exchanging sessions...");
    } else {
      console.log("No session tokens found...");
      throw redirect({ to: "/", statusCode: 307 });
    }

    if (session.data.session_jwt) {
      console.log("switching orgs using session_jwt");
      //
      const { session_jwt, organization } =
        await stytchClient.sessions.exchange({
          organization_id: data.organisationId,
          session_jwt: session.data.session_jwt,
        });

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.update({
        intermediate_session_token: undefined,
        session_jwt: session_jwt,
        userEmail: "",
      });

      throw redirect({
        to: "/organisations/$organisationSlug/dashboard",
        params: {
          organisationSlug: organization.organization_slug,
        },
        statusCode: 307,
      });
    } else {
      console.log("switching orgs using intermediate_session_token");

      //
      const { session_jwt, organization } =
        await stytchClient.discovery.intermediateSessions.exchange({
          intermediate_session_token: session.data.intermediate_session_token,
          organization_id: data.organisationId,
          session_duration_minutes: 60,
        });

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.update({
        intermediate_session_token: undefined,
        session_jwt: session_jwt,
        userEmail: "",
      });

      throw redirect({
        to: "/organisations/$organisationSlug/dashboard",
        params: {
          organisationSlug: organization.organization_slug,
        },
        statusCode: 307,
      });
    }
  });

export const Route = createFileRoute("/discovery/$organisationId")({
  component: RouteComponent,
  loader: async ({ params: { organisationId } }) =>
    await loader({ data: { organisationId } }),
});

function RouteComponent() {
  return <div>Hello "/discovery/$organisationId"!</div>;
}
