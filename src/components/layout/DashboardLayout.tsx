import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Palette, 
  Heart, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/user', label: 'User', icon: User },
  { path: '/trip', label: 'Trip', icon: MapPin },
  { path: '/style', label: 'Style', icon: Palette },
  { path: '/mood', label: 'Mood', icon: Heart },
];

export function DashboardLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-cyan-50 relative">
      {/* Animated background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-300/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border-r border-blue-800/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-blue-800/30">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img 
                src="/roamana-logo.png" 
                alt="Roamana" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="font-bold text-xl text-white italic tracking-wide">
                Roamana
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-blue-800/50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 no-underline",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 !text-white shadow-lg shadow-blue-500/30"
                      : "!text-white hover:bg-white hover:!text-slate-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-blue-800/30">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-800/30 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.profilePhoto || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-slate-900">
                  {currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-blue-300 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 justify-start text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-blue-800/30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-blue-800/50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-blue-300">
              Welcome back, <span className="font-medium text-white">{currentUser.name}</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
