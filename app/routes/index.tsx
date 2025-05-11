import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div>
        <h1>Discovery flow</h1>
        <p>Products used:</p>
        <ul>
          <li>Email Magic Links</li>
          <li>OAuth</li>
        </ul>
        <p>
          In this recipe we demonstrate a backend implementation of our
          Discovery login flow with custom UI components. This flow allows users
          to log into any Organization that they have access to using either
          Google OAuth, Microsoft OAuth, or Email Magic Links. Users can also
          create a new Organization.
        </p>
        <Link to="/discovery">Discovery</Link>
      </div>
    </>
  );
}
