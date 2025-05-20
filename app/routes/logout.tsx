import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "@/lib/session";
import { useStytch } from "@/lib/stytch";

const loader = createServerFn().handler(async () => {
  const session = await useAppSession();
  const stytch = useStytch();

  await stytch.sessions.revoke({
    session_jwt: session.data.session_jwt,
  });

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
