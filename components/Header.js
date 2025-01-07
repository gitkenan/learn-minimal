import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Menu } from 'lucide-react';

function MobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-end px-4 py-3">
        <div ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-50 rounded-full"
          >
            <Menu size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white shadow-lg rounded-lg py-2 z-50">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation('/')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Create New Plan
              </button>
              <button
                onClick={signOut}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {isMobile ? (
          <MobileMenu />
        ) : (
          <div className="flex items-center justify-between h-16 px-8">
            {/* Combined Navigation and User Section */}
            <div className="flex items-center gap-6 ml-auto">
              <nav className="flex gap-4">
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
              </nav>
              {!user ? (
                <Link
                  href="/auth"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Sign In
                </Link>
              ) : (
                <button
                  onClick={signOut}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
