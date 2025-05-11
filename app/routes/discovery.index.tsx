import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import React from "react";
import loadStytch from "~/utils/loadStytch";

export type LoginData = {
  email: string;
};

export const beginMagicLinkDiscovery = createServerFn({ method: "POST" })
  .validator((data: LoginData) => data)
  .handler(async (ctx) => {
    console.log("email:", ctx.data.email);

    const stytchClient = loadStytch();

    await stytchClient.magicLinks.email.discovery.send({
      email_address: ctx.data.email,
      discovery_redirect_url: "http://localhost:3000/api/authenticate",
    });

    return {};
  });

export const Route = createFileRoute("/discovery/")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const [email, setEmail] = React.useState("jake.net@gmail.com");

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
      <Link to="/">Home</Link>
    </>
  );
}
