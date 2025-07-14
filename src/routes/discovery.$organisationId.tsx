import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useStytch } from "@/lib/stytch";
import { useAppSession } from "@/lib/session";

export type OrgId = {
  organisationId: string;
};

const loader = createServerFn()
  .validator((d: OrgId) => d)
  .handler(async ({ data }) => {
    const session = await useAppSession();

    const stytch = useStytch();

    if (session.data.sessionJwt) {
      // console.log("switching orgs using session_jwt", session.data);

      const exchangeSessionResult = await stytch.sessions.exchange({
        organization_id: data.organisationId,
        session_jwt: session.data.sessionJwt,
        // session_duration_minutes: parseInt(process.env.SESSION_DURATION_MINUTES!),
      });

      // console.log("Session exchange result", exchangeSessionResult);

      const { session_jwt, organization, member } = exchangeSessionResult;

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.clear();
      await session.update({
        sessionJwt: session_jwt,
        email: member.email_address,
        organisationId: organization.organization_id,
        organisationName: organization.organization_name,
        memberId: member.member_id,
      });

      throw redirect({
        to: "/dashboard",
        statusCode: 307,
      });
    }

    if (session.data.intermediateSessionToken) {
      const { session_jwt, organization, member } = await stytch.discovery.intermediateSessions.exchange({
        intermediate_session_token: session.data.intermediateSessionToken,
        organization_id: data.organisationId,
      });

      if (!session_jwt) {
        // TODO: handle MFA
        throw new Error("Need to handle MFA");
      }

      await session.clear();
      await session.update({
        sessionJwt: session_jwt,
        email: member.email_address,
        organisationId: organization.organization_id,
        organisationName: organization.organization_name,
        memberId: member.member_id,
      });

      throw redirect({ to: "/dashboard", statusCode: 307 });
    }

    throw redirect({ to: "/" });
  });

export const Route = createFileRoute("/discovery/$organisationId")({
  loader: async ({ params: { organisationId } }) => await loader({ data: { organisationId } }),
});
