import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(() => {
  return NextResponse.next();
});

// Configuration to specify which routes this middleware applies to
export const config = {
    matcher: [
      /*
       * Match all API routes and pages for Clerk authentication
       */
      "/api/:path*",
      "/((?!_next|.*\\..*).*)",  // Matches all routes except those starting with `_next` or having an extension like `.js`, `.css`, etc.
    ],
  };