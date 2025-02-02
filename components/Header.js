// components/Header.js
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
    <div className="md:hidden absolute right-4 top-4">
      <div ref={menuRef} className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 bg-[#1d332b] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200"
        >
          <Menu size={20} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-48 bg-[#1d332b] rounded-2xl shadow-lg py-2 z-50">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-[#2a3d33] hover:text-white transition-colors duration-200"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('/exam')}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-[#2a3d33] hover:text-white transition-colors duration-200"
            >
              Exam
            </button>
            <button
              onClick={() => handleNavigation('/calendar')}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-[#2a3d33] hover:text-white transition-colors duration-200"
            >
              Calendar
            </button>
            <button
              onClick={() => handleNavigation('/')}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-[#2a3d33] hover:text-white transition-colors duration-200"
            >
              Create New Plan
            </button>
            <button
              onClick={signOut}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-[#2a3d33] hover:text-white transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#1a2b23] py-3">
      {isMobile ? (
        <MobileMenu />
      ) : (
        <nav className="flex gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-[#1a2b23] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200 text-sm border border-white/10"
          >
            Dashboard
          </Link>
          <Link 
            href="/exam" 
            className="px-4 py-2 bg-[#1a2b23] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200 text-sm border border-white/10"
          >
            Exam
          </Link>
          <Link 
            href="/calendar" 
            className="px-4 py-2 bg-[#1a2b23] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200 text-sm border border-white/10"
          >
            Calendar
          </Link>
          {!user ? (
            <Link
              href="/auth"
              className="px-4 py-2 bg-[#1d332b] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200 text-sm"
            >
              Sign In
            </Link>
          ) : (
            <button
              onClick={signOut}
              className="px-4 py-2 bg-[#1d332b] hover:bg-[#2a3d33] rounded-full text-white/70 hover:text-white transition-all duration-200 text-sm"
            >
              Sign Out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
