'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'AI Humanizer', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
  { name: 'Pricing', href: '/pricing' },
];

export default function HeaderNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-slate-800">
              Natural Write
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm transition-colors',
                    isActive
                      ? 'text-green-600'
                      : 'text-slate-600 hover:text-green-600'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <button className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2 transition-colors">
                Log in
              </button>
            </Link>
            <Link href="/try-free">
              <button className="bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none text-sm px-4 py-2 shadow-md">
                Try for free
              </button>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'text-green-600'
                        : 'text-slate-600 hover:text-green-600'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <hr className="my-4" />
              <Link href="/login" className="px-3 py-2 text-sm text-slate-600">
                Log in
              </Link>
              <Link href="/try-free" className="mt-2">
                <button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-[10px] px-4 py-2 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Try for free
                </button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}