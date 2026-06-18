import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckCircle, Building2, Users, ShoppingCart,
  Package, Calendar, Receipt, AlertTriangle, Warehouse, DollarSign,
  BarChart3, Smartphone, FileText, Shield, Settings, LogOut, Menu, Search, Bell, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/user-approval', label: 'User Approval', icon: CheckCircle },
  { path: '/admin/cooperative-management', label: 'Cooperative Management', icon: Building2 },
  { path: '/admin/beneficiary-database', label: 'Beneficiary Database', icon: Users },
  { path: '/admin/input-catalog', label: 'Input Catalog', icon: ShoppingCart },
  { path: '/admin/input-distribution', label: 'Input Distribution', icon: Package },
  { path: '/admin/distribution-schedule', label: 'Distribution Schedule', icon: Calendar },
  { path: '/admin/distribution-receipt', label: 'Distribution Receipt', icon: Receipt },
  { path: '/admin/returns-complaints', label: 'Returns & Complaints', icon: AlertTriangle },
  { path: '/admin/inventory-warehouse', label: 'Inventory & Warehouse', icon: Warehouse },
  { path: '/admin/subsidy-allocation', label: 'Subsidy Allocation', icon: DollarSign },
  { path: '/admin/analytics-reports', label: 'Analytics & Reports', icon: BarChart3 },
  { path: '/admin/field-data-collection', label: 'Field Data Collection', icon: Smartphone },
  { path: '/admin/export-reports', label: 'Export Reports', icon: FileText },
  { path: '/admin/security-monitoring', label: 'Security Monitoring', icon: Shield },
  { path: '/admin/system-settings', label: 'System Settings', icon: Settings },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-agri-green rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">AgriSubsidy System</p>
            <p className="text-xs text-gray-400">AGRIFOP - Kigali, Rwanda</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 mt-1">
        <p className="text-xs text-gray-400">Navigation Menu</p>
        <p className="text-xs font-semibold text-agri-green">Administrator</p>
      </div>
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${active ? 'bg-green-50 text-agri-green font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon size={14} className="flex-shrink-0" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">AGRIFOP</p>
            <p className="text-xs text-gray-400">Digital Input & Subsidy Management System</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-52 bg-white border-r border-gray-100 flex flex-col z-10"><SidebarContent /></aside>
        </div>
      )}
      <aside className="hidden lg:flex flex-col w-52 bg-white border-r border-gray-100 flex-shrink-0"><SidebarContent /></aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} className="text-gray-500" /></button>
          <div className="flex-1 relative max-w-2xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green" placeholder="Search farmers, cooperatives, inputs..." />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/admin/security-monitoring" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User size={16} className="text-agri-green" /></div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-gray-800">System Administrator</p>
                <p className="text-xs text-gray-400">ID: ADM001</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
        <footer className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
          <div className="flex gap-4"><span>✉ info@agrifop.rw</span><span>📞 +250 788 000 000</span><span>📍 Kigali, Rwanda</span></div>
          <span>© 2025 AGRIFOP · AgriSubsidy System. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
