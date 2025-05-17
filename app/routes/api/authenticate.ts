import { createAPIFileRoute } from "@tanstack/react-start/api";
import { useStytch } from "~/utils/stytch";
import { useAppSession } from "~/utils/session";

export const APIRoute = createAPIFileRoute("/api/authenticate")({
  GET: async ({ request, params }) => {
    // http://localhost:3000/api/authenticate?stytch_redirect_type=login&stytch_token_type=discovery&token=VVgffoAqcuHo7cN7QWKkdeslVVkOM5Qjs_7O4Z11oC1z
    const url = new URL(request.url);
    const stytch_redirect_type = url.searchParams.get("stytch_redirect_type");
    const stytch_token_type = url.searchParams.get("stytch_token_type");
    const token = url.searchParams.get("token");

    console.log({ stytch_redirect_type, stytch_token_type });

    // http://localhost:3000/api/authenticate?stytch_token_type=discovery_oauth&token=AqaZp5x2ZqZ29gcSr1wdOeVbN-VoypFaHA4jNW2L_z_J
    if (stytch_token_type == "discovery_oauth" && token) {
      //
      const stytch = useStytch();

      try {
        const { intermediate_session_token, email_address } =
          await stytch.oauth.discovery.authenticate({
            discovery_oauth_token: token,
          });

        console.log(
          "logged in with oauth",
          intermediate_session_token,
          email_address
        );

        const session = await useAppSession();

        await session.update({
          intermediate_session_token: intermediate_session_token,
          email_address: email_address,
          session_jwt: undefined,
        });

        return new Response("success", {
          status: 307,
          headers: {
            location: "/discovery/select-organisation",
          },
        });
      } catch (error) {
        console.log("discovery oauth authenticate failed");

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
        const { intermediate_session_token, email_address } =
          await stytch.magicLinks.discovery.authenticate({
            discovery_magic_links_token: token,
          });

        const session = await useAppSession();

        await session.update({
          intermediate_session_token: intermediate_session_token,
          email_address: email_address,
          session_jwt: undefined,
        });

        return new Response("success", {
          status: 307,
          headers: {
            location: "/discovery/select-organisation",
          },
        });
      } catch (error) {
        console.log("discovery authenticate failed");

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
