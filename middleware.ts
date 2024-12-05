import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware({});
 
export const config = {
<<<<<<< HEAD
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

=======
  matcher: ["/", "/(api|trpc)(.*)", "/((?!.*\\..*|_next).*)"],
};
>>>>>>> f1f78ab (fixing catchall)
