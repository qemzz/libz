import { BookOpen, Menu, X, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/search', label: 'Browse Books' },
  { path: '/new-arrivals', label: 'New Arrivals' },
  { path: '/popular', label: 'Popular' },
];

export function StudentHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isStudent, studentInfo, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-xl text-foreground hidden sm:block">
              School Library
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isStudent && (
              <Link
                to="/student/my-requests"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/student/my-requests' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                My Requests
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  Admin Panel
                </Button>
              </Link>
            )}
            {isStudent && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{studentInfo?.name}</span>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!user && (
              <Link to="/student/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isStudent && (
              <>
                <Link
                  to="/student/my-requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  My Requests
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="block py-2 text-sm font-medium text-destructive hover:text-destructive/80 w-full text-left"
                >
                  Sign Out ({studentInfo?.name})
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-primary"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
