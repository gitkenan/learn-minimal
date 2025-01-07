import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-600"
        >
          Dashboard
        </button>

        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:bg-gray-50 rounded-full"
        >
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-12 w-48 bg-white shadow-lg rounded-lg py-2 z-50">
          <button
            onClick={signOut}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}