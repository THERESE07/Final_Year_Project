import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Building2, Package, DollarSign } from 'lucide-react';

// Legacy page - not used in main routing. See features/admin/AdminDashboard.tsx
const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.full_name}</p>
      </div>
      <div className="card text-center py-12 text-gray-400">
        <p>Use the role-specific dashboards via the navigation menu.</p>
      </div>
    </div>
  );
};

export default DashboardHome;
