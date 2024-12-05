'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default function Navigation() {
  return (
    <nav className="container mx-auto px-4 py-4 flex justify-between">
      <div>
        <Link href="/" className="text-white text-lg font-semibold">
          Learn Minimal
        </Link>
      </div>
      <div className="flex items-center space-x-6">
        <SignedOut>
          <Link href="/sign-in" className="text-white hover:text-gray-300 transition-colors duration-300">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-white hover:text-gray-300 transition-colors duration-300">
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
          <SignOutButton />
        </SignedIn>
      </div>
    </nav>
  );
}
