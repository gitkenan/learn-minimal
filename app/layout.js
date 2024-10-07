// app/layout.js

import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Learn Minimal",
  description: "A minimal learning plan application.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>Learn Minimal</title>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className={`bg-gray-900 text-gray-100 ${geistSans.variable} ${geistMono.variable}`}>
          <nav className="container mx-auto px-4 py-4 flex justify-between">
            <div>
              <Link href="/" className="text-white text-lg font-semibold">
                Learn Minimal
              </Link>
            </div>
            <div>
              <SignedOut>
                <Link href="/sign-in" className="text-white mr-4">
                  Sign In
                </Link>
                <Link href="/sign-up" className="text-white">
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="text-white mr-4">
                  Dashboard
                </Link>
                <Link href="/sign-out" className="text-white">
                  Sign Out
                </Link>
              </SignedIn>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

