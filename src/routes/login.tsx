import { LoginForm } from "@/components/login-form";
import { formatOAuthDiscoveryStartURL } from "@/lib/stytch";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { GalleryVerticalEnd } from "lucide-react";

export const loader = createServerFn().handler(async (ctx) => {
  const host = getHeader("Host") || "";
  const proto = getHeader("x-forwarded-proto") || "";
  const protocol = proto ? "https://" : "http://";
  const domain = protocol + host;

  const googleOAuthDiscoveryStartUrl = formatOAuthDiscoveryStartURL(domain, "google");

  return {
    googleOAuthDiscoveryStartUrl,
  };
});

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  loader: async () => await loader(),
});

function RouteComponent() {
  const data = Route.useLoaderData();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        <LoginForm googleOAuthDiscoveryStartUrl={data.googleOAuthDiscoveryStartUrl} />
      </div>
    </div>
  );
}
