import { useSession } from "@tanstack/react-start/server";

type AppSession = {
  intermediateSessionToken: string;
  sessionJwt: string;
  email: string;
  organisationId: string;
  memberId: string;
};

export function useAppSession() {
  return useSession<AppSession>({
    password: process.env.SESSION_PASSWORD!,
    name: "app",
  });
}
