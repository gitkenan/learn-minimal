// components/SignOutButton.jsx
"use client";

import { useClerk } from '@clerk/nextjs';

export default function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut()}
      className="text-white text-lg hover:text-neon-green transition-colors duration-300"
    >
      Sign Out
    </button>
  );
}
