import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { OAuthButton, OAuthProviders } from "~/components/oauth-button";
import {
  formatOAuthDiscoveryStartURL,
  formatOAuthStartURL,
  useStytch,
} from "~/utils/stytch";

export type LoginData = {
  email: string;
};

export const beginMagicLinkDiscovery = createServerFn({ method: "POST" })
  .validator((data: LoginData) => data)
  .handler(async (ctx) => {
    console.log("email:", ctx.data.email);

    const stytch = useStytch();

    // TODO: The discovery_redirect_url needs to use a base url from config.
    await stytch.magicLinks.email.discovery.send({
      email_address: ctx.data.email,
      discovery_redirect_url: "http://localhost:3000/api/authenticate",
    });

    return {};
  });

export const loader = createServerFn().handler(async (ctx) => {
  console.log("loader called on discovery");
  const host = getHeader("Host") || "";
  const proto = getHeader("x-forwarded-proto") || "";
  const protocol = proto ? "https://" : "http://";
  const domain = protocol + host;

  const googleOAuthDiscoveryStartUrl = formatOAuthDiscoveryStartURL(
    domain,
    "google"
  );

  return {
    googleOAuthDiscoveryStartUrl: googleOAuthDiscoveryStartUrl,
  };
});

export const Route = createFileRoute("/discovery/")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const [email, setEmail] = useState("jake.net@gmail.com");

  return (
    <>
      <h1>Log in or sign up</h1>
      <p>Enter your email address below to receive a login email.</p>
      <div>
        <div>
          <label htmlFor="email">Enter your email</label>
        </div>
        <div>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <button
            type="submit"
            onClick={() => {
              beginMagicLinkDiscovery({
                data: {
                  email: email,
                },
              }).then(() => {
                router.invalidate();
              });
            }}
          >
            Continue
          </button>
        </div>
      </div>

      <OAuthButton
        providerType={OAuthProviders.Google}
        oAuthStartUrl={data.googleOAuthDiscoveryStartUrl}
      />

      <Link to="/">Home</Link>
    </>
  );
}
