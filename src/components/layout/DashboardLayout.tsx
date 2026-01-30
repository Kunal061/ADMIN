import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/Toast';
import { Sidebar } from './Sidebar';
import { ProfileSection } from './ProfileSection';
import { useApp } from '@/context/AppContext';

const PAGE_TITLES: Record<string, string> = {
  '/users': 'Users Management',
  '/trip': 'Trip Management',
  '/mood': 'Mood Management',
  '/style': 'Style Management',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? '';
  const { toast } = useApp();

  return (
    <div className="min-h-screen h-screen relative font-sans flex flex-col bg-white">
      <Toast message={toast} />
      {/* White header: logo + page title (left); profile (right); mobile menu button left of logo */}
      <header
        className="w-full flex items-center justify-between gap-4 px-4 py-0.5 lg:px-6 lg:py-1 shrink-0 relative z-20 bg-white border-b border-gray-200"
      >
        <div className="flex items-center gap-2 ml-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-700 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img
            src="/roamana-logo.png"
            alt="Roamana"
            className="h-16 w-auto max-w-[240px] object-contain ml-2"
          />
        </div>
        {pageTitle && (
          <div className="ml-0 lg:ml-29 shrink-0">
            <h1 className="text-xl font-semibold text-gray-900 font-heading hidden sm:block">
              {pageTitle}
            </h1>
          </div>
        )}
        <div className="ml-auto shrink-0">
          <ProfileSection />
        </div>
      </header>

      {/* Sidebar + main content row */}
      <div className="flex-1 flex min-h-0 relative z-10">
        <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden px-6 pt-1 pb-5 lg:px-10 lg:pt-2 lg:pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 bg-white">
          <div className="w-full relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
