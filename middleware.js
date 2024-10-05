// middleware.js
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/'], // Make the home page public
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/'], // Apply to all routes
};

