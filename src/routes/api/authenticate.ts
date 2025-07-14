import { useStytch } from "@/lib/stytch";
import { useAppSession } from "@/lib/session";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/authenticate").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    // const stytch_redirect_type = url.searchParams.get("stytch_redirect_type");
    const stytch_token_type = url.searchParams.get("stytch_token_type");
    const token = url.searchParams.get("token");

    const stytch = useStytch();
    const session = await useAppSession();

    let intermediateSessionToken: string;
    let emailAddress: string;

    try {
      if (stytch_token_type == "discovery_oauth" && token) {
        const { intermediate_session_token, email_address } = await stytch.oauth.discovery.authenticate({
          discovery_oauth_token: token,
        });

        intermediateSessionToken = intermediate_session_token;
        emailAddress = email_address;
      } else if (stytch_token_type === "discovery" && token) {
        const { intermediate_session_token, email_address } = await stytch.magicLinks.discovery.authenticate({
          discovery_magic_links_token: token,
        });

        intermediateSessionToken = intermediate_session_token;
        emailAddress = email_address;
      } else {
        throw new Error("Unhandle auth callback");
      }
    } catch (error) {
      return new Response("failed", {
        status: 307,
        headers: { location: "/" },
      });
    }

    await session.update({
      intermediateSessionToken: intermediateSessionToken,
      email: emailAddress,
      sessionJwt: undefined,
    });

    return new Response("success", {
      status: 307,
      headers: {
        location: "/discovery/select-organisation",
      },
    });
  },
});
