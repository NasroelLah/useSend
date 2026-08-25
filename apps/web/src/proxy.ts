import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
  "/api/stripe/webhook(.*)",
  "/api/ses/(.*)",
  // Machine-to-machine API: authenticated by API key inside the Hono app
  // (server/public-api/hono.ts -> getTeamFromToken), NOT by Clerk sessions.
  // Without this, clerkMiddleware's auth.protect() answers unauthenticated
  // requests (e.g. from apps/smtp-server) with a 302 to the sign-in URL
  // instead of letting Hono return a proper 401 JSON error.
  "/api/v1(.*)",
  "/api/health(.*)",
  "/unsubscribe(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
