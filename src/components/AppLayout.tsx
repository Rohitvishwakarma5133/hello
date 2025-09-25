'use client';

import { usePathname } from 'next/navigation';
import HeaderNavigation from './HeaderNavigation';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderNavigation />
      <main className="flex-1">
        {children}
      </main>
      {/* Only show footer on non-home pages */}
      {pathname !== '/' && <Footer />}
    </div>
  );
}
