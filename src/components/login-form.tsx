import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStytch } from "@/lib/stytch";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async (ctx) => {
    const stytch = useStytch();
    await stytch.magicLinks.email.discovery.send({
      email_address: ctx.data.email,
      discovery_redirect_url: "http://localhost:3000/api/authenticate",
    });
  });

export function LoginForm(props: { googleOAuthDiscoveryStartUrl: string }) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "pending" | "success" | "error">("idle");

  const _loginFn = useServerFn(loginFn);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("pending");
    try {
      await _loginFn({ data: { email: email } });
      setStatus("success");
    } catch (error) {
      toast.error("Something went wrong, please try again soon");
      setStatus("error");
    }
  };

  if (status == "success") {
    return (
      <div className={cn("flex flex-col gap-6")}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>We emailed a magic link to {email}. Click the link to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-center text-sm">
                Need help?{" "}
                <a href="#" className="underline underline-offset-4">
                  Contact support
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google or Github account</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={props.googleOAuthDiscoveryStartUrl}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Login with Google
                  </Link>
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">Or continue with</span>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@email.com"
                      required
                      value={email}
                      disabled={status === "pending"}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {status === "pending" && <Loader2 className="animate-spin" />}
                    Login
                  </Button>
                </div>
              </form>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
