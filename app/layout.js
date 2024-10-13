// app/layout.js

import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import localFont from 'next/font/local';
import './globals.css';
import SignOutButton from '../components/SignOutButton'; // Import the client component

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'Learn Minimal',
  description: 'A minimal learning plan application.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>Learn Minimal</title>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body
          className={`bg-black text-gray-100 ${geistSans.variable} ${geistMono.variable}`}
        >
          <nav className="container mx-auto px-4 py-4 flex justify-between">
            <div>
              <Link href="/" className="text-white text-lg font-semibold">
                Learn Minimal
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <SignedOut>
                <Link href="/sign-in" className="text-white mr-4">
                  Sign In
                </Link>
                <Link href="/sign-up" className="text-white">
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="text-white text-lg hover:text-neon-green transition-colors duration-300"
                >
                  Dashboard
                </Link>
                {/* Use the SignOutButton client component */}
                <SignOutButton />
              </SignedIn>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
