import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(() => {
  return NextResponse.next();
});

// Temporarily match all routes for testing purposes
export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
    ],
  };
  
