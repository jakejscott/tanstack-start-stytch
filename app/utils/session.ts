import { useSession } from "@tanstack/react-start/server";

type SessionUser = {
  intermediate_session_token?: string;
  session_jwt?: string;
  userEmail?: string;
};

export function useAppSession() {
  return useSession<SessionUser>({
    password: "ChangeThisBeforeShippingToProdOrYouWillBeFired",
  });
}
