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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleNavigation = (path) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-end px-4 py-3">
        <div ref={menuRef} className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-50 rounded-[4px] card interactive"
          >
            <Menu size={20} />
          </button>

          {menuOpen && (
            <>
              <div className="bottom-sheet-enhanced__overlay" />
              <div className="fixed inset-x-0 bottom-0 top-14 bg-white card py-2 z-[60] animate-fade-in border-t border-gray-100
                    transform-gpu will-change-transform overflow-visible
                    animate-slide-up">
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 hover:text-accent transition-colors duration-200"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation('/exam')}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 hover:text-accent transition-colors duration-200"
                >
                  Exam
                </button>
                <button
                  onClick={() => handleNavigation('/calendar')}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 hover:text-accent transition-colors duration-200"
                >
                  Calendar
                </button>
                <button
                  onClick={() => handleNavigation('/')}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 hover:text-accent transition-colors duration-200"
                >
                  Create New Plan
                </button>
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 hover:text-accent transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </>
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
    <header className="bg-white shadow-sm hero-gradient relative">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {isMobile ? (
          <MobileMenu />
        ) : (
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="gradient-text-accent text-lg font-bold">
              Learn Minimal
            </Link>
            
            <div className="flex items-center gap-6 ml-auto">
              <nav className="flex gap-4">
                <Link 
                  href="/" 
                  className="text-secondary hover:text-accent transition-colors duration-200"
                >
                  Home
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-secondary hover:text-accent transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/exam" 
                  className="text-secondary hover:text-accent transition-colors duration-200"
                >
                  Exam
                </Link>
                <Link 
                  href="/calendar" 
                  className="text-secondary hover:text-accent transition-colors duration-200"
                >
                  Calendar
                </Link>
              </nav>
              {!user ? (
                <Link
                  href="/auth"
                  className="text-secondary hover:text-accent transition-colors duration-200"
                >
                  Sign In
                </Link>
              ) : (
                <button
                  onClick={signOut}
                  className="text-secondary hover:text-accent transition-colors duration-200"
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
