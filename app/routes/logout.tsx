import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();
  const stytch = useStytch();

  if (session.data.session_jwt) {
    try {
      await stytch.sessions.revoke({
        session_jwt: session.data.session_jwt,
      });
    } catch (error) {
      console.warn("Unable to revoke session", error);
    }
  }

  await session.clear();
  console.log("logout");

  throw redirect({
    to: "/",
    statusCode: 307,
  });
});

export const Route = createFileRoute("/logout")({
  loader: async () => await loader(),
});
