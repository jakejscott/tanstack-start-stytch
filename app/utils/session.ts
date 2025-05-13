import { useSession } from "@tanstack/react-start/server";

type AppSession = {
  intermediate_session_token: string;
  session_jwt: string;
  email_address: string;
  organisation_id: string;
};

export function useAppSession() {
  return useSession<AppSession>({
    password: process.env.SESSION_PASSWORD!,
    name: "app",
  });
}
