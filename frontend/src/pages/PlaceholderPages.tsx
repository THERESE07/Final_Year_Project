import React from 'react';
import { FileText, BarChart3, Settings, Bell } from 'lucide-react';

const PlaceholderPage: React.FC<{ title: string; icon: React.ElementType; description: string }> = ({ title, icon: Icon, description }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <div className="card text-center py-20">
      <Icon size={52} className="mx-auto mb-4 text-agri-green opacity-60" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">This module is ready to be implemented. The backend API is fully set up and connected.</p>
      <span className="inline-block mt-4 bg-green-100 text-agri-green text-xs px-3 py-1.5 rounded-full font-medium">Coming in next sprint</span>
    </div>
  </div>
);

export const DistributionsPage: React.FC = () => (
  <PlaceholderPage title="Distribution Management" icon={FileText} description="Track and manage input distributions to farmers" />
);

export const AnalyticsPage: React.FC = () => (
  <PlaceholderPage title="Analytics & Reporting" icon={BarChart3} description="Real-time analytics and comprehensive reports" />
);

export const SettingsPage: React.FC = () => (
  <PlaceholderPage title="System Settings" icon={Settings} description="Configure system preferences and parameters" />
);

export const NotificationsPage: React.FC = () => (
  <PlaceholderPage title="Notifications" icon={Bell} description="View all system notifications and alerts" />
);
