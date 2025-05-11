import { createAPIFileRoute } from "@tanstack/react-start/api";
import loadStytch from "~/utils/loadStytch";
import { useAppSession } from "~/utils/session";

export const APIRoute = createAPIFileRoute("/api/authenticate")({
  GET: async ({ request, params }) => {
    // http://localhost:3000/api/authenticate?stytch_redirect_type=login&stytch_token_type=discovery&token=VVgffoAqcuHo7cN7QWKkdeslVVkOM5Qjs_7O4Z11oC1z
    const url = new URL(request.url);
    const stytch_redirect_type = url.searchParams.get("stytch_redirect_type");
    const stytch_token_type = url.searchParams.get("stytch_token_type");
    const token = url.searchParams.get("token");

    console.log({ stytch_redirect_type, stytch_token_type });

    if (stytch_token_type === "discovery" && token) {
      const stytchClient = loadStytch();

      let intermediate_session_token: string;
      try {
        const authRes = await stytchClient.magicLinks.discovery.authenticate({
          discovery_magic_links_token: token,
        });

        intermediate_session_token = authRes.intermediate_session_token;
      } catch (error) {
        return new Response("failed", {
          status: 307,
          headers: {
            location: "/",
          },
        });
      }

      const session = await useAppSession();
      await session.update({
        intermediate_session_token: intermediate_session_token,
      });

      return new Response("success", {
        status: 307,
        headers: {
          location: "/select-organisation",
        },
      });
    } else {
      throw new Error("Unhandle auth callback");
    }
  },
});
