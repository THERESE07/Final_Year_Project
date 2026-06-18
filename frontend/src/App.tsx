import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FullPageLoader } from './components/common';

import LandingPage from './pages/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';

import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import UserApproval from './features/admin/UserApproval';
import CooperativeManagement from './features/admin/CooperativeManagement';
import InputCatalog from './features/admin/InputCatalog';
import {
  SubsidyAllocation, AnalyticsReports, InventoryWarehouse, FieldDataCollection,
  ExportReports, SecurityMonitoring, SystemSettings,
  ReturnsComplaints, DistributionReceipt, DistributionSchedule
} from './features/admin/AdminPages';

import FarmerLayout from './features/farmer/FarmerLayout';
import FarmerDashboard from './features/farmer/FarmerDashboard';
import FarmerInputs from './features/farmer/FarmerInputs';
import FarmerInputRequests from './features/farmer/FarmerInputRequests';
import FarmerSubsidies from './features/farmer/FarmerSubsidies';
import SecurityPage from './features/farmer/SecurityPage';
import NotificationsPage from './features/farmer/NotificationsPage';
import ProfilePage from './features/farmer/ProfilePage';

import CoopLayout from './features/cooperative/CoopLayout';
import CoopDashboard from './features/cooperative/CoopDashboard';
import BeneficiaryDatabase from './features/cooperative/BeneficiaryDatabase';
import AdminInputDistribution from './features/admin/AdminInputDistribution';
import InputDistribution from './features/cooperative/InputDistribution';
import InputRequests from './features/cooperative/InputRequests';
import PendingFarmers from './features/cooperative/PendingFarmers';
import ReportsPage from './features/cooperative/ReportsPage';
import CoopProfile from './features/cooperative/CoopProfile';
import AdminBeneficiaryDatabase from './features/admin/AdminBeneficiaryDatabase';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } } });

// Loader moved to components/common — using FullPageLoader

const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace/>;
  if (user.role === 'cooperative') return <Navigate to="/cooperative" replace/>;
  return <Navigate to="/admin" replace/>;
};

const Guard: React.FC<{children:React.ReactNode;roles?:string[]}> = ({children,roles}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <RoleRedirect/>;
  return <>{children}</>;
};

const PublicOnly: React.FC<{children:React.ReactNode}> = ({children}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader/>;
  if (user) return <RoleRedirect/>;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage/>}/>
            <Route path="/login" element={<PublicOnly><LoginPage/></PublicOnly>}/>
            <Route path="/register" element={<PublicOnly><RegisterPage/></PublicOnly>}/>
            <Route path="/home" element={<Guard><RoleRedirect/></Guard>}/>

            <Route path="/admin" element={<Guard roles={['admin']}><AdminLayout/></Guard>}>
              <Route index element={<AdminDashboard/>}/>
              <Route path="user-approval" element={<UserApproval/>}/>
              <Route path="cooperative-management" element={<CooperativeManagement/>}/>
              <Route path="beneficiary-database" element={<AdminBeneficiaryDatabase/>}/>
              <Route path="input-catalog" element={<InputCatalog/>}/>
              <Route path="input-distribution" element={<AdminInputDistribution/>}/>
              <Route path="distribution-schedule" element={<DistributionSchedule/>}/>
              <Route path="distribution-receipt" element={<DistributionReceipt/>}/>
              <Route path="returns-complaints" element={<ReturnsComplaints/>}/>
              <Route path="inventory-warehouse" element={<InventoryWarehouse/>}/>
              <Route path="subsidy-allocation" element={<SubsidyAllocation/>}/>
              <Route path="analytics-reports" element={<AnalyticsReports/>}/>
              <Route path="field-data-collection" element={<FieldDataCollection/>}/>
              <Route path="export-reports" element={<ExportReports/>}/>
              <Route path="security-monitoring" element={<SecurityMonitoring/>}/>
              <Route path="system-settings" element={<SystemSettings/>}/>
            </Route>

            <Route path="/farmer" element={<Guard roles={['farmer']}><FarmerLayout/></Guard>}>
              <Route index element={<FarmerDashboard/>}/>
              <Route path="inputs" element={<FarmerInputs/>}/>
              <Route path="input-requests" element={<FarmerInputRequests/>}/>
              <Route path="subsidies" element={<FarmerSubsidies/>}/>
              <Route path="security" element={<SecurityPage/>}/>
              <Route path="notifications" element={<NotificationsPage/>}/>
              <Route path="profile" element={<ProfilePage/>}/>
            </Route>

            <Route path="/cooperative" element={<Guard roles={['cooperative']}><CoopLayout/></Guard>}>
              <Route index element={<CoopDashboard/>}/>
              <Route path="farmers" element={<BeneficiaryDatabase/>}/>
              <Route path="pending-farmers" element={<PendingFarmers/>}/>
              <Route path="inputs" element={<InputDistribution/>}/>
              <Route path="input-requests" element={<InputRequests/>}/>
              <Route path="reports" element={<ReportsPage/>}/>
              <Route path="security" element={<SecurityPage/>}/>
              <Route path="notifications" element={<NotificationsPage/>}/>
              <Route path="profile" element={<CoopProfile/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/" replace/>}/>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ success:{style:{background:'#2d6a4f',color:'#fff'}}, error:{style:{background:'#dc2626',color:'#fff'}}, duration:4000 }}/>
      </AuthProvider>
    </QueryClientProvider>
  );
}
