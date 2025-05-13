import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useStytch } from "~/utils/stytch";
import { useAppSession } from "~/utils/session";

export type OrgId = {
  organisationId: string;
};

const loader = createServerFn()
  .validator((d: OrgId) => d)
  .handler(async ({ data }) => {
    const session = await useAppSession();

    const stytch = useStytch();

    if (session.data.session_jwt) {
      console.log("switching orgs using session_jwt");

      const { session_jwt, organization, member } =
        await stytch.sessions.exchange({
          organization_id: data.organisationId,
          session_jwt: session.data.session_jwt,
        });

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.clear();
      await session.update({
        session_jwt: session_jwt,
        email_address: member.email_address,
        organisation_id: organization.organization_id,
      });

      throw redirect({
        to: "/organisations/$organisationSlug/dashboard",
        params: {
          organisationSlug: organization.organization_slug,
        },
        statusCode: 307,
      });
    }

    if (session.data.intermediate_session_token) {
      console.log("switching orgs using intermediate_session_token");

      const { session_jwt, organization, member } =
        await stytch.discovery.intermediateSessions.exchange({
          intermediate_session_token: session.data.intermediate_session_token,
          organization_id: data.organisationId,
          session_duration_minutes: 60,
        });

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.clear();
      await session.update({
        session_jwt: session_jwt,
        email_address: member.email_address,
        organisation_id: organization.organization_id,
      });

      throw redirect({
        to: "/organisations/$organisationSlug/dashboard",
        params: {
          organisationSlug: organization.organization_slug,
        },
        statusCode: 307,
      });
    }

    console.log("no session tokens, todo redirect to logout");
    throw redirect({ to: "/", statusCode: 307 });
  });

export const Route = createFileRoute("/discovery/$organisationId")({
  loader: async ({ params: { organisationId } }) =>
    await loader({ data: { organisationId } }),
});
