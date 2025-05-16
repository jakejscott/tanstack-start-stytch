import {
  formatOAuthDiscoveryStartURL,
  formatOAuthStartURL,
} from "~/utils/stytch";
import { Link } from "@tanstack/react-router";
import GoogleIconSvg from "~/icons/google";

export enum OAuthProviders {
  Google = "google",
  Microsoft = "microsoft",
}

const providerInfo = {
  [OAuthProviders.Google]: {
    providerTypeTitle: "Google",
    providerIcon: <GoogleIconSvg />,
  },
};

type Props = {
  providerType: OAuthProviders;
  hostDomain: string;
  orgSlug?: string;
};

export const OAuthButton = ({ providerType, hostDomain, orgSlug }: Props) => {
  const isDiscovery = orgSlug == null;
  const oAuthStartURL = isDiscovery
    ? formatOAuthDiscoveryStartURL(hostDomain, providerType)
    : formatOAuthStartURL(hostDomain, providerType, orgSlug);

  return (
    <Link to={oAuthStartURL} className="oauth-button">
      <div className="oauth-button__icon">
        {providerInfo[providerType].providerIcon}
      </div>
      <span className="oauth-button__text">{`Continue with ${providerInfo[providerType].providerTypeTitle}`}</span>
    </Link>
  );
};
