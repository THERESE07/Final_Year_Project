import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Shield, Users, FileText, Smartphone, ArrowRight, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { usePublicStats } from '../hooks';
import { QueryErrorBanner } from '../components/common';

const formatNumber = (n: number) => n.toLocaleString();
const formatSubsidy = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return formatNumber(n);
};
const growthLabel = (pct: number) => `${pct >= 0 ? '+' : ''}${pct}% this month`;

const LandingPage: React.FC = () => {
  const { stats, growth, isLoading, isError, refetch } = usePublicStats();

  const heroStats = [
    { label: 'Farmers', value: isLoading ? '...' : formatNumber(Number(stats.total_farmers || 0)), color: 'text-agri-green', bg: 'bg-green-50' },
    { label: 'Cooperatives', value: isLoading ? '...' : formatNumber(Number(stats.total_cooperatives || 0)), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Inputs Distributed', value: isLoading ? '...' : `${formatNumber(Number(stats.total_distributed_tons || 0))} tons`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Subsidies', value: isLoading ? '...' : `RWF ${formatSubsidy(Number(stats.total_subsidies_rwf || 0))}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const impactStats = [
    { value: isLoading ? '...' : formatNumber(Number(stats.total_farmers || 0)), label: 'Registered Farmers', sub: growthLabel(Number(growth.farmers_pct || 0)), color: 'text-agri-green' },
    { value: isLoading ? '...' : formatNumber(Number(stats.total_cooperatives || 0)), label: 'Active Cooperatives', sub: growthLabel(Number(growth.cooperatives_pct || 0)), color: 'text-blue-600' },
    { value: isLoading ? '...' : formatNumber(Number(stats.total_distributed_tons || 0)), label: 'Tons Distributed', sub: growthLabel(Number(growth.distributed_pct || 0)), color: 'text-orange-600' },
    { value: isLoading ? '...' : formatSubsidy(Number(stats.total_subsidies_rwf || 0)), label: 'RWF Total Subsidies', sub: growthLabel(Number(growth.subsidies_pct || 0)), color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-agri-green rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">AgriSubsidy</p>
              <p className="text-xs text-gray-500">AGRIFOP · Kigali, Rwanda</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Login</Link>
            <Link to="/register" className="text-sm font-medium text-white bg-agri-green px-4 py-2 rounded-lg hover:bg-agri-lightgreen transition-colors">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-agri-green text-white text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Digital Agricultural Management Platform
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Transparent Digital Management of Agricultural Inputs & Subsidies
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Empowering Rwanda's agricultural sector through efficient, transparent, and data-driven input and subsidy management for sustainable farming success.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base flex items-center gap-2">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">Sign In</Link>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-agri-green" />
              </div>
              <div>
                <p className="text-xs text-gray-400">System Overview</p>
                <p className="font-bold text-gray-900">Real-Time Data</p>
              </div>
            </div>
            {isError && (
              <div className="mb-4">
                <QueryErrorBanner message="Unable to load live statistics." onRetry={() => refetch()} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {heroStats.map((s, i) => (
                <div key={i} className={`${s.bg} rounded-xl p-4`}>
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color} ${isLoading ? 'animate-pulse' : ''}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Comprehensive Platform Features</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">End-to-end digital tools designed to streamline agricultural input distribution and subsidy management across Rwanda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Automated Input & Subsidy Tracking', desc: 'Real-time tracking of agricultural inputs and subsidies from distribution to beneficiary receipt with QR code verification.', color: 'bg-green-100 text-agri-green' },
              { icon: BarChart3, title: 'Real-Time Analytics & Monitoring', desc: 'Monitor input distribution, stock levels, and subsidy disbursements with live dashboards and predictive insights.', color: 'bg-blue-100 text-blue-600' },
              { icon: Shield, title: 'Secure Beneficiary Management', desc: 'Protected database with multi-factor authentication and verification for all farmers and cooperatives.', color: 'bg-purple-100 text-purple-600' },
              { icon: FileText, title: 'Transparent Reporting & Audit', desc: 'Generate comprehensive reports with complete audit trails for accountability and compliance.', color: 'bg-orange-100 text-orange-600' },
              { icon: Users, title: 'Cooperative Collaboration', desc: 'Digital tools for cooperative management, member engagement, and performance tracking.', color: 'bg-teal-100 text-teal-600' },
              { icon: Smartphone, title: 'Mobile Field Data Collection', desc: 'Offline-capable mobile forms with GPS tagging for field verification and evidence collection.', color: 'bg-pink-100 text-pink-600' },
            ].map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 px-6 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Who We Serve</h2>
            <p className="text-gray-500">Built for all stakeholders in Rwanda's agricultural ecosystem</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '👨‍🌾', title: 'Farmers', desc: 'View allocated inputs, track subsidies, and receive notifications about distributions.', color: 'bg-agri-green' },
              { icon: '🌿', title: 'Cooperative Leaders', desc: 'Manage farmer registrations, distribute inputs, and monitor cooperative activities.', color: 'bg-blue-600' },
              { icon: '⚙️', title: 'Administrators', desc: 'Full system control, user management, analytics, and comprehensive reporting.', color: 'bg-orange-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-xl mb-4`}>{s.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-agri-green rounded-2xl p-8 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">About AGRIFOP</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              Agribusiness Focused Partnership Organization (AGRIFOP) is dedicated to transforming Rwanda's agricultural sector through innovative digital solutions and sustainable farming practices.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-500 mb-6">To enhance agricultural productivity and farmer livelihoods through transparent, efficient, and data-driven management of inputs and subsidies.</p>
            {[
              { title: 'Transparency & Accountability', desc: 'Complete audit trails and real-time monitoring' },
              { title: 'Digital Transformation', desc: 'Modern technology for agricultural management' },
              { title: 'Farmer Empowerment', desc: 'Direct access to inputs and subsidies' },
            ].map((m, i) => (
              <div key={i} className="flex items-start gap-3 mb-4">
                <CheckCircle size={20} className="text-agri-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Impact in Numbers</h2>
          <p className="text-gray-500 mb-12">Making a real difference in Rwanda's agricultural sector</p>
          {isError && (
            <div className="max-w-lg mx-auto mb-8">
              <QueryErrorBanner message="Live impact data unavailable." onRetry={() => refetch()} />
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <p className={`text-3xl font-bold ${stat.color} mb-1 ${isLoading ? 'animate-pulse' : ''}`}>{stat.value}</p>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                <p className="text-xs text-green-500 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Contact Us</h2>
          <p className="text-gray-500 mb-10">Get in touch with the AGRIFOP team</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Phone, label: 'Phone', value: '+250 788 000 000' },
              { icon: Mail, label: 'Email', value: 'info@agrifop.rw' },
              { icon: MapPin, label: 'Location', value: 'Kigali, Rwanda' },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <c.icon size={20} className="text-agri-green" />
                </div>
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className="text-sm font-medium text-gray-700">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-agri-green py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to Transform Agricultural Management?</h2>
        <p className="text-green-100 mb-8 max-w-2xl mx-auto">Join thousands of farmers and cooperatives already benefiting from our secure, transparent digital platform.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="bg-white text-agri-green font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors flex items-center gap-2">
            Register Now <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
            Login to Your Account
          </Link>
        </div>
        <div className="flex justify-center gap-6 mt-6 text-xs text-green-200">
          <span>✓ Secure & Verified</span>
          <span>✓ Real-Time Updates</span>
          <span>✓ 24/7 Support</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-agri-green rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <span className="text-white font-bold text-sm">AgriSubsidy</span>
            </div>
            <p className="text-xs leading-relaxed">Digital Input & Subsidy Management System for Rwanda's Agricultural Cooperatives</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
            {['Login', 'Register', 'Features', 'About'].map(l => <p key={l} className="text-xs mb-2 hover:text-white cursor-pointer">{l}</p>)}
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">For Users</h4>
            {['Farmers', 'Cooperatives', 'Administrators', 'Input Suppliers'].map(l => <p key={l} className="text-xs mb-2 hover:text-white cursor-pointer">{l}</p>)}
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <p className="text-xs mb-1">📞 +250 788 000 000</p>
            <p className="text-xs mb-1">✉️ info@agrifop.rw</p>
            <p className="text-xs">📍 Kigali, Rwanda</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          © 2025 AGRIFOP · AgriSubsidy System. All rights reserved. Empowering Rwanda's Agricultural Sector Through Digital Innovation
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
