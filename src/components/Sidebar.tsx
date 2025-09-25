'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'AI Humanizer', href: '/', icon: '🤖' },
  { name: 'Pricing', href: '/pricing', icon: '💰' },
  { name: 'Login', href: '/login', icon: '🔑' },
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-semibold text-foreground">AI Humanizer</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Try for Free Button */}
      <div className="p-4 border-t border-border">
        <Link href="/try-free">
          <Button 
            className="w-full bg-caribbean-green hover:bg-caribbean-green/90 text-white"
            size="sm"
          >
            🚀 Try for Free
          </Button>
        </Link>
      </div>
    </div>
  );
}