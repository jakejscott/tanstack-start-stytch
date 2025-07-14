import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const authenticate = createServerFn().handler(async () => {
  const session = await useAppSession();

  if (!session.data.sessionJwt) {
    throw redirect({ to: "/" });
  }

  const stytch = useStytch();

  try {
    const { session_jwt } = await stytch.sessions.authenticateJwt({ session_jwt: session.data.sessionJwt });
    await session.update({ sessionJwt: session_jwt });
  } catch {
    throw redirect({ to: "/login" });
  }

  const sidebarState = await getCookie("sidebar_state");

  return {
    email: session.data.email,
    organisationId: session.data.organisationId,
    organisationName: session.data.organisationName,
    memberId: session.data.memberId,
    sidebarOpen: sidebarState == "true",
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
  return <Outlet />;
}
