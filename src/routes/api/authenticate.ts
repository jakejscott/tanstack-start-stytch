import { useStytch } from "@/lib/stytch";
import { useAppSession } from "@/lib/session";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/authenticate").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    // const stytch_redirect_type = url.searchParams.get("stytch_redirect_type");
    const stytch_token_type = url.searchParams.get("stytch_token_type");
    const token = url.searchParams.get("token");

    if (stytch_token_type == "discovery_oauth" && token) {
      const stytch = useStytch();
      try {
        const { intermediate_session_token, email_address } = await stytch.oauth.discovery.authenticate({
          discovery_oauth_token: token,
        });

        const session = await useAppSession();

        await session.update({
          intermediateSessionToken: intermediate_session_token,
          email: email_address,
          sessionJwt: undefined,
        });

        return new Response("success", {
          status: 307,
          headers: {
            location: "/discovery/select-organisation",
          },
        });
      } catch (error) {
        return new Response("failed", {
          status: 307,
          headers: {
            location: "/",
          },
        });
      }
    } else if (stytch_token_type === "discovery" && token) {
      const stytch = useStytch();

      try {
        const { intermediate_session_token, email_address } = await stytch.magicLinks.discovery.authenticate({
          discovery_magic_links_token: token,
        });

        const session = await useAppSession();

        await session.update({
          intermediateSessionToken: intermediate_session_token,
          email: email_address,
          sessionJwt: undefined,
        });

        return new Response("success", {
          status: 307,
          headers: {
            location: "/discovery/select-organisation",
          },
        });
      } catch (error) {
        // console.log("discovery authenticate failed");

        return new Response("failed", {
          status: 307,
          headers: {
            location: "/",
          },
        });
      }
    } else {
      throw new Error("Unhandle auth callback");
    }
  },
});
