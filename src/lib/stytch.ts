import { B2BClient, envs } from "stytch";

const publicToken = process.env.STYTCH_PUBLIC_TOKEN;

let client: B2BClient;
export function useStytch() {
  if (!client) {
    client = new B2BClient({
      project_id: process.env.STYTCH_PROJECT_ID!,
      secret: process.env.STYTCH_SECRET!,
      env: stytchEnv,
    });
  }
  return client;
}

// export type Member = Awaited<ReturnType<typeof client.magicLinks.authenticate>>["member"];
// export type Organization = Awaited<ReturnType<typeof client.organizations.get>>["organization"];
// export type SessionsAuthenticateResponse = Awaited<ReturnType<typeof client.sessions.authenticate>>;
// export type SAMLConnection = Awaited<ReturnType<typeof client.sso.saml.createConnection>>["connection"];
// export type OIDCConnection = Awaited<ReturnType<typeof client.sso.oidc.createConnection>>["connection"];
// export type DiscoveredOrganizations = Awaited<ReturnType<typeof client.discovery.organizations.list>>["discovered_organizations"];

export type DiscoveredOrganisation = {
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  membershipType: string;
  membershipMemberId: string;
  membershipRoles: string[];
};

const stytchEnv = process.env.STYTCH_ENV === "live" ? envs.live : envs.test;

export const formatSSOStartURL = (redirectDomain: string, connection_id: string): string => {
  const redirectURL = redirectDomain + "/api/authenticate";
  return `${stytchEnv}v1/public/sso/start?connection_id=${connection_id}&public_token=${publicToken}&login_redirect_url=${redirectURL}&signup_redirect_url=${redirectURL}`;
};

export const formatOAuthDiscoveryStartURL = (redirectDomain: string, provider: "google"): string => {
  const redirectURL = redirectDomain + "/api/authenticate";
  return `${stytchEnv}v1/b2b/public/oauth/${provider}/discovery/start?public_token=${publicToken}&discovery_redirect_url=${redirectURL}`;
};

export const formatOAuthStartURL = (redirectDomain: string, provider: string, org_slug: string): string => {
  const redirectURL = redirectDomain + "/api/authenticate";
  return `${stytchEnv}v1/b2b/public/oauth/${provider}/start?public_token=${publicToken}&slug=${org_slug}&login_redirect_url=${redirectURL}&signup_redirect_url=${redirectURL}`;
};
