import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/Toast';
import { Sidebar } from './Sidebar';
import { ProfileSection } from './ProfileSection';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

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
      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        visible={toast?.visible ?? false}
      />
      {/* White header: on lg uses grid so title aligns with main content (sidebar + padding) */}
      <header
        className={cn(
          "w-full shrink-0 relative bg-white border-b border-gray-200",
          sidebarOpen ? "z-10 lg:z-20" : "z-20",
          "flex flex-col lg:grid lg:grid-cols-[18rem_1fr] lg:items-center"
        )}
      >
        {/* Logo row / col 1 */}
        <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 lg:py-1 lg:col-start-1">
          <div className="flex items-center gap-2 sm:ml-2 lg:ml-0 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:opacity-90 shrink-0"
              style={{ backgroundColor: '#06B3C4' }}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <img
              src="/roamana-logo.png"
              alt="Roamana"
              className="h-10 sm:h-14 lg:h-16 w-auto max-w-[120px] sm:max-w-48 lg:max-w-60 object-contain"
            />
          </div>
          <div className="flex lg:hidden">
            <ProfileSection />
          </div>
        </div>
        {/* Title + Profile row / col 2 - aligns with main content (px-10) on lg */}
        <div className="hidden lg:flex lg:col-start-2 lg:pl-10 lg:pr-6 items-center justify-between min-w-0">
          {pageTitle && (
            <h1 className="text-xl font-semibold text-gray-900 font-heading truncate text-left">
              {pageTitle}
            </h1>
          )}
          <ProfileSection />
        </div>
        {/* Mobile/tablet: title row aligned with main content (px-3 sm:px-6) */}
        {pageTitle && (
          <div className="flex lg:hidden px-3 py-1 sm:px-6">
            <h1 className="text-xl font-semibold text-gray-900 font-heading truncate text-left">
              {pageTitle}
            </h1>
          </div>
        )}
      </header>

      {/* Sidebar + main content row */}
      <div className="flex-1 flex min-h-0 relative z-10">
        <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden px-3 pt-1 pb-5 sm:px-6 lg:px-10 lg:pt-2 lg:pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 bg-white">
          <div className="w-full relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
