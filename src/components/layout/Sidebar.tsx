import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  MapPin,
  Palette,
  Heart,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/users', label: 'USERS', icon: User },
  { path: '/trip', label: 'TRIP', icon: MapPin },
  { path: '/mood', label: 'MOOD', icon: Heart },
  { path: '/style', label: 'STYLE', icon: Palette },
];

function SidebarContent({ onClose, isMobile = false }: { onClose: () => void; isMobile?: boolean }) {
  const location = useLocation();

  return (
    <>
      {isMobile && (
        <div className="flex items-center justify-end h-14 px-4 shrink-0 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-full font-medium text-sm transition-all duration-200 no-underline border border-transparent",
                isActive
                  ? "bg-[#06B3C4]/10 text-[#06B3C4]"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-[#06B3C4]" : "text-gray-600")} />
              <span className={cn("truncate", isActive ? "text-[#06B3C4]" : "text-gray-700")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ sidebarOpen, onClose }: SidebarProps) {
  useEffect(() => {
    if (sidebarOpen) {
      const w = window.innerWidth;
      if (w < 1024) {
        document.body.style.overflow = 'hidden';
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const mobileOverlay = sidebarOpen ? (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed top-0 left-0 bottom-0 w-72 z-[9999] bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out translate-x-0 lg:hidden"
      >
        <div className="flex flex-col h-full" style={{ minHeight: '100vh' }}>
          <SidebarContent onClose={onClose} isMobile />
        </div>
      </aside>
    </>
  ) : null;

  return (
    <>
      {mobileOverlay && createPortal(mobileOverlay, document.body)}
      {/* Desktop sidebar - in flow, always visible on lg */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex flex-col h-full flex-1" style={{ minHeight: '100%' }}>
          <SidebarContent onClose={onClose} isMobile={false} />
        </div>
      </aside>
    </>
  );
}
