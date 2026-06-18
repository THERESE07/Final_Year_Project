import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type LoginMethod = 'email' | 'mobile';
type UserRole = 'admin' | 'cooperative' | 'farmer';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [role, setRole] = useState<UserRole>('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', phone: '', pin: '', remember: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ ...form, login_method: loginMethod });
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<UserRole, string> = { admin: 'Admin', cooperative: 'Cooperative', farmer: 'Farmer' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-agri-green rounded-2xl flex items-center justify-center mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">AgriSubsidy System</h1>
          <p className="text-sm text-agri-green">Digital Input & Subsidy Management</p>
          <p className="text-xs text-gray-500">AGRIFOP - Kigali, Rwanda</p>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Login Method</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['email', 'mobile'] as LoginMethod[]).map(m => (
              <button key={m} type="button" onClick={() => setLoginMethod(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${loginMethod === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {m === 'email' ? <><Mail size={15} /> Email/Password</> : <><Phone size={15} /> Mobile/PIN</>}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Login As</p>
          <div className="flex gap-2">
            {(['admin', 'cooperative', 'farmer'] as UserRole[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${role === r ? 'bg-agri-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {roleLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMethod === 'email' ? (
            <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" placeholder="Enter your email" className="input-field pl-10"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="input-field pl-10 pr-10"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
            </>
          ) : (
            <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" placeholder="+250 788 000 000" className="input-field pl-10"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
                <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" placeholder="Enter your PIN" maxLength={4} className="input-field pl-10 text-center text-xl tracking-widest"
                    value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value }))} required /></div></div>
            </>
          )}
          {role === 'admin' && <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"><Shield size={16} className="text-orange-500 flex-shrink-0" /><p className="text-xs text-orange-700">Admin login requires 2-Factor Authentication</p></div>}
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
            {loading ? 'Signing in...' : role === 'admin' ? 'Continue to 2FA' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
          <p className="font-medium mb-1">Test Accounts:</p>
          <p>Admin: admin@agrifop.rw / Admin@123</p>
          <p>Coop: eric.habimana@agrifop.rw / Coop@123</p>
          <p>Farmer: jean.uwimana@agrifop.rw / Farmer@123</p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/register" className="text-agri-green font-semibold hover:underline">Register here</Link>
        </p>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">🔒 Secure authentication • Data encryption enabled</div>
    </div>
  );
};

export default LoginPage;
