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

export function Sidebar({ sidebarOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-72 transform transition-transform duration-300 ease-in-out shrink-0 fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-gray-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:relative lg:z-auto lg:h-full"
        )}
      >
        <div className="flex flex-col h-full relative z-10" style={{ minHeight: '100vh' }}>
          {/* Mobile: close button only */}
          <div className="flex items-center justify-end h-14 px-4 shrink-0 lg:hidden border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
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
        </div>
      </aside>
    </>
  );
}
