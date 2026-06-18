// ============================================================
// features/auth/RegisterPage.tsx  (was: pages/RegisterPage.tsx)
//
// CHANGES vs original:
//   1. Field component moved OUTSIDE render → fixes cursor-loss bug.
//      Now imported from components/common as <FormField>.
//   2. validateStep() moved to utils/validation.ts → component is
//      ~80 lines shorter and focused purely on rendering.
//   3. CROP_TYPES, PROVINCES, STEPS, LAND_OWNERSHIP_TYPES all
//      imported from constants/index.ts → no more inline arrays.
//   4. SpinnerButton replaces inline SVG spinner JSX.
//   5. All other logic (state, handlers) is UNCHANGED.
// ============================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, CreditCard, Phone, Mail, MapPin, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../api/client';
import toast from 'react-hot-toast';
import {
  CROP_TYPES, PROVINCES, REGISTRATION_STEPS, LAND_OWNERSHIP_TYPES
} from '../../constants';
import {
  validateRegistrationStep, RegisterFormData
} from '../../utils/validation';
import { parsePayload, registerPayloadSchema } from '../../utils/schemas';
import { FormField, SpinnerButton } from '../../components/common';

// ── Helpers ───────────────────────────────────────────────────
const initialForm: RegisterFormData = {
  full_name: '', national_id: '', phone: '', email: '', gender: '', role: 'farmer',
  cooperative_id: '', cooperative_name: '', province: '', district: '', sector: '',
  farm_size_hectares: '', land_ownership: '', years_of_experience: '',
  crop_types: [], password: '', confirm_password: '', agreed: false,
  national_id_doc: null, authorization_letter: null,
};

// ── Step indicator ────────────────────────────────────────────
const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center justify-center mb-8">
    {REGISTRATION_STEPS.map((s, i) => (
      <React.Fragment key={s}>
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
            ${i + 1 <= step ? 'bg-agri-green text-white' : 'bg-gray-200 text-gray-500'}`}>
            {i + 1 < step ? <CheckCircle size={18} /> : i + 1}
          </div>
          <span className="text-xs mt-1 text-gray-500 hidden sm:block">{s}</span>
        </div>
        {i < REGISTRATION_STEPS.length - 1 && (
          <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-agri-green' : 'bg-gray-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Success screen ────────────────────────────────────────────
const SuccessScreen: React.FC<{ onLogin: () => void; role: string }> = ({ onLogin, role }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-agri-green" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
      <p className="text-gray-500 text-sm mb-4">
        {role === 'farmer'
          ? 'Your registration has been sent to your cooperative leader for approval.'
          : role === 'cooperative'
            ? 'Your application has been sent to the administrator for document review and approval.'
            : 'Your registration has been submitted for approval.'}
      </p>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
        <p className="text-sm font-semibold text-gray-800">
          Application Status: <span className="text-orange-500">Pending Approval</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">You will be notified once your account is approved</p>
      </div>
      <button onClick={onLogin} className="w-full btn-primary py-3">Go to Login</button>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<RegisterFormData>(initialForm);

  const { data: registrationCoops, isLoading: coopsLoading } = useQuery({
    queryKey: ['registration-cooperatives'],
    queryFn: () => authAPI.getRegistrationCooperatives(),
  });

  const cooperativesList: Array<{ id: string; name: string; province?: string; district?: string; has_manager?: boolean }> =
    (registrationCoops as any[]) || [];

  const update = (field: string, value: any) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  };

  const toggleCrop = (crop: string) => {
    setForm(p => ({
      ...p,
      crop_types: p.crop_types.includes(crop)
        ? p.crop_types.filter(c => c !== crop)
        : [...p.crop_types, crop],
    }));
  };

  const handleNext = () => {
    const e = validateRegistrationStep(step, form);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const e = validateRegistrationStep(step, form);
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      const payload = {
        full_name:           form.full_name.trim(),
        national_id:         form.national_id.trim(),
        email:               form.email.trim().toLowerCase(),
        phone:               form.phone.trim(),
        gender:              form.gender,
        role:                form.role,
        password:            form.password,
        cooperative_id:      form.cooperative_id || undefined,
        cooperative_name:    form.cooperative_name.trim() || undefined,
        province:            form.province,
        district:            form.district.trim(),
        sector:              form.sector.trim(),
        farm_size_hectares:  form.farm_size_hectares ? parseFloat(form.farm_size_hectares) : undefined,
        land_ownership:      form.land_ownership || undefined,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : undefined,
        crop_types:          form.crop_types.length > 0 ? form.crop_types : undefined,
      };
      const parsed = parsePayload(registerPayloadSchema, payload);
      if (!parsed.success) {
        toast.error(parsed.message);
        setLoading(false);
        return;
      }
      if (form.role === 'cooperative') {
        const fd = new FormData();
        Object.entries(parsed.data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
          }
        });
        if (form.national_id_doc) fd.append('national_id_doc', form.national_id_doc);
        if (form.authorization_letter) fd.append('authorization_letter', form.authorization_letter);
        await authAPI.registerWithDocuments(fd);
      } else {
        await authAPI.register(parsed.data);
      }
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(msg);
      if (msg.includes('Email'))       { setStep(1); setErrors({ email: msg }); }
      else if (msg.includes('National ID')) { setStep(1); setErrors({ national_id: msg }); }
      else if (msg.includes('Phone'))  { setStep(1); setErrors({ phone: msg }); }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SuccessScreen onLogin={() => navigate('/login')} role={form.role} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-agri-green rounded-2xl flex items-center justify-center mb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Create New Account</h1>
          <p className="text-xs text-agri-green">Register for AgriSubsidy System - AGRIFOP</p>
        </div>

        <StepIndicator step={step} />

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name *" error={errors.full_name}>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`input-field pl-9 ${errors.full_name ? 'border-red-400' : ''}`}
                    placeholder="Enter full name" value={form.full_name}
                    onChange={e => update('full_name', e.target.value)} />
                </div>
              </FormField>

              <FormField label="National ID *" error={errors.national_id}>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`input-field pl-9 ${errors.national_id ? 'border-red-400' : ''}`}
                    placeholder="16-digit national ID" maxLength={16}
                    value={form.national_id}
                    onChange={e => update('national_id', e.target.value.replace(/\D/g, ''))} />
                </div>
              </FormField>

              <FormField label="Phone Number *" error={errors.phone}>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`input-field pl-9 ${errors.phone ? 'border-red-400' : ''}`}
                    placeholder="+250 788 000 000" value={form.phone}
                    onChange={e => update('phone', e.target.value)} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for SMS notifications</p>
              </FormField>

              <FormField label="Email Address *" error={errors.email}>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" className={`input-field pl-9 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="email@example.com" value={form.email}
                    onChange={e => update('email', e.target.value)} />
                </div>
              </FormField>

              <FormField label="Gender *" error={errors.gender}>
                <select className={`input-field ${errors.gender ? 'border-red-400' : ''}`}
                  value={form.gender} onChange={e => update('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </FormField>

              <FormField label="Register As *" error={errors.role}>
                <select className="input-field" value={form.role} onChange={e => update('role', e.target.value)}>
                  <option value="farmer">Farmer / Member</option>
                  <option value="cooperative">Cooperative Leader</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Location & Cooperative Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.role === 'cooperative' ? (
                <div className="sm:col-span-2">
                  <FormField label="Select Your Cooperative *" error={errors.cooperative_id}>
                    <select
                      className={`input-field ${errors.cooperative_id ? 'border-red-400' : ''}`}
                      value={form.cooperative_id}
                      onChange={e => update('cooperative_id', e.target.value)}
                      disabled={coopsLoading}
                    >
                      <option value="">{coopsLoading ? 'Loading cooperatives...' : 'Select cooperative'}</option>
                      {cooperativesList.map(c => (
                        <option key={c.id} value={c.id} disabled={c.has_manager}>
                          {c.name}{c.district ? ` — ${c.district}` : ''}{c.has_manager ? ' (has manager)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">You will be assigned as manager of the selected cooperative upon approval.</p>
                  </FormField>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <FormField label="Cooperative (Optional)" error={errors.cooperative_id}>
                    <select
                      className="input-field"
                      value={form.cooperative_id}
                      onChange={e => update('cooperative_id', e.target.value)}
                      disabled={coopsLoading}
                    >
                      <option value="">{coopsLoading ? 'Loading...' : 'Select cooperative (optional)'}</option>
                      {cooperativesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.district ? ` — ${c.district}` : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Or enter a name below if your cooperative is not listed</p>
                  </FormField>
                  <FormField label="Cooperative Name (if not listed)" error={errors.cooperative_name}>
                    <input className="input-field" placeholder="Enter your cooperative name"
                      value={form.cooperative_name} onChange={e => update('cooperative_name', e.target.value)} />
                  </FormField>
                </div>
              )}

              <FormField label="Province *" error={errors.province}>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select className={`input-field pl-9 ${errors.province ? 'border-red-400' : ''}`}
                    value={form.province} onChange={e => update('province', e.target.value)}>
                    <option value="">Select province</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </FormField>

              <FormField label="District *" error={errors.district}>
                <input className={`input-field ${errors.district ? 'border-red-400' : ''}`}
                  placeholder="e.g. Musanze" value={form.district}
                  onChange={e => update('district', e.target.value)} />
              </FormField>

              <FormField label="Sector *" error={errors.sector}>
                <input className={`input-field ${errors.sector ? 'border-red-400' : ''}`}
                  placeholder="e.g. Muhoza" value={form.sector}
                  onChange={e => update('sector', e.target.value)} />
              </FormField>
            </div>
          </div>
        )}

        {/* Step 3 — Farm Details + Password */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
              {form.role === 'farmer' ? 'Farm Details & Security' : 'Account Security'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.role === 'farmer' && (
                <>
                  <FormField label="Farm Size (Hectares) *" error={errors.farm_size_hectares}>
                    <input type="number" step="0.1" min="0.1"
                      className={`input-field ${errors.farm_size_hectares ? 'border-red-400' : ''}`}
                      placeholder="e.g. 2.5" value={form.farm_size_hectares}
                      onChange={e => update('farm_size_hectares', e.target.value)} />
                  </FormField>

                  <FormField label="Land Ownership *" error={errors.land_ownership}>
                    <select className={`input-field ${errors.land_ownership ? 'border-red-400' : ''}`}
                      value={form.land_ownership} onChange={e => update('land_ownership', e.target.value)}>
                      <option value="">Select ownership type</option>
                      {LAND_OWNERSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Years of Experience" error={errors.years_of_experience}>
                    <input type="number" min="0" className="input-field" placeholder="e.g. 5"
                      value={form.years_of_experience}
                      onChange={e => update('years_of_experience', e.target.value)} />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Crop Types * (Select all that apply)" error={errors.crop_types}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {CROP_TYPES.map(crop => (
                          <label key={crop} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-sm transition-colors
                            ${form.crop_types.includes(crop) ? 'border-agri-green bg-green-50 text-agri-green' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0
                              ${form.crop_types.includes(crop) ? 'border-agri-green bg-agri-green' : 'border-gray-300'}`}>
                              {form.crop_types.includes(crop) && (
                                <svg width="8" height="8" viewBox="0 0 8 8">
                                  <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                                </svg>
                              )}
                            </div>
                            <input type="checkbox" className="sr-only"
                              checked={form.crop_types.includes(crop)}
                              onChange={() => toggleCrop(crop)} />
                            {crop}
                          </label>
                        ))}
                      </div>
                    </FormField>
                  </div>
                </>
              )}

              {form.role === 'cooperative' && (
                <>
                  <div className="sm:col-span-2">
                    <FormField label="National ID Document * (PDF, JPG, PNG)" error={errors.national_id_doc}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                        className={`input-field ${errors.national_id_doc ? 'border-red-400' : ''}`}
                        onChange={e => update('national_id_doc', e.target.files?.[0] || null)} />
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="Authorization Letter * (PDF, JPG, PNG)" error={errors.authorization_letter}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                        className={`input-field ${errors.authorization_letter ? 'border-red-400' : ''}`}
                        onChange={e => update('authorization_letter', e.target.files?.[0] || null)} />
                      <p className="text-xs text-gray-400 mt-1">Official letter authorizing you as cooperative leader</p>
                    </FormField>
                  </div>
                </>
              )}

              <FormField label="Password *" error={errors.password}>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'}
                    className={`input-field pl-9 pr-9 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Min 8 characters" value={form.password}
                    onChange={e => update('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm Password *" error={errors.confirm_password}>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showConfirm ? 'text' : 'password'}
                    className={`input-field pl-9 pr-9 ${errors.confirm_password ? 'border-red-400' : ''}`}
                    placeholder="Re-enter password" value={form.confirm_password}
                    onChange={e => update('confirm_password', e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Review & Submit</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              {[
                { label: 'Full Name',  value: form.full_name },
                { label: 'National ID', value: form.national_id },
                { label: 'Email',      value: form.email },
                { label: 'Phone',      value: form.phone },
                { label: 'Role',       value: form.role === 'farmer' ? 'Farmer / Member' : 'Cooperative Leader' },
                { label: 'Location',   value: [form.sector, form.district, form.province].filter(Boolean).join(', ') },
                ...(form.cooperative_name ? [{ label: 'Cooperative', value: form.cooperative_name }] : []),
                ...(form.role === 'farmer' ? [
                  { label: 'Farm Size', value: form.farm_size_hectares ? `${form.farm_size_hectares} hectares` : '—' },
                  { label: 'Crops',     value: form.crop_types.join(', ') || '—' },
                ] : []),
              ].map(f => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{f.label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-xs truncate">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-orange-800 font-medium">
                ⏳ Your account will be <strong>Pending Approval</strong>
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {form.role === 'farmer'
                  ? 'Your cooperative leader will review your application before you can log in.'
                  : form.role === 'cooperative'
                    ? 'An administrator will review your documents and approve your account.'
                    : 'An administrator will review your application before you can log in.'}
              </p>
            </div>
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors
              ${errors.agreed ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-agri-green'}`}>
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center mt-0.5 flex-shrink-0
                ${form.agreed ? 'border-agri-green bg-agri-green' : 'border-gray-300'}`}
                onClick={() => update('agreed', !form.agreed)}>
                {form.agreed && (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={form.agreed}
                onChange={e => update('agreed', e.target.checked)} />
              <span className="text-sm text-gray-600">
                I confirm that all information provided is accurate and agree to the terms and conditions
              </span>
            </label>
            {errors.agreed && (
              <p className="text-xs text-red-500 mt-1">{errors.agreed}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary py-3">
              ← Previous
            </button>
          ) : (
            <Link to="/login" className="btn-secondary py-3 text-center">← Back to Login</Link>
          )}
          {step < 4 ? (
            <button type="button" onClick={handleNext} className="btn-primary py-3">Continue →</button>
          ) : (
            <SpinnerButton loading={loading} label="Submit Application"
              loadingLabel="Submitting..." onClick={handleSubmit}
              className="btn-primary py-3 w-full" />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-agri-green font-medium hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
