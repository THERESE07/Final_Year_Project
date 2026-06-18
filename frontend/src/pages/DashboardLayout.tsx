import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, DollarSign, Building2,
  Bell, LogOut, Menu, X, ChevronDown, Settings, BarChart3, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cooperative', 'farmer'] },
  { path: '/dashboard/users', label: 'Users', icon: Users, roles: ['admin'] },
  { path: '/dashboard/cooperatives', label: 'Cooperatives', icon: Building2, roles: ['admin', 'cooperative'] },
  { path: '/dashboard/inputs', label: 'Inputs', icon: Package, roles: ['admin', 'cooperative', 'farmer'] },
  { path: '/dashboard/distributions', label: 'Distributions', icon: FileText, roles: ['admin', 'cooperative', 'farmer'] },
  { path: '/dashboard/subsidies', label: 'Subsidies', icon: DollarSign, roles: ['admin', 'cooperative', 'farmer'] },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'cooperative'] },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin', 'cooperative', 'farmer'] },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const allowedNav = navItems.filter(item => user && item.roles.includes(user.role));

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-green-700">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.5">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">AgriSubsidy</p>
          <p className="text-green-300 text-xs">AGRIFOP · Rwanda</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowedNav.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-white text-agri-green' : 'text-green-100 hover:bg-green-700'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-green-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-green-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-green-200 hover:text-white text-sm w-full px-2 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
          <LogOut size={15} /> Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-agri-green flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-agri-green flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-gray-800 hidden lg:block">
              {allowedNav.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-agri-green flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
