import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "../api/client";
import toast from "react-hot-toast";

const CROP_TYPES = [
  "Maize",
  "Rice",
  "Beans",
  "Wheat",
  "Coffee",
  "Tea",
  "Cassava",
  "Potatoes",
  "Vegetables",
  "Sorghum",
];
const PROVINCES = ["Kigali", "Northern", "Southern", "Eastern", "Western"];
const STEPS = ["Personal Info", "Location", "Farm Details", "Security"];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    national_id: "",
    phone: "",
    email: "",
    gender: "",
    role: "farmer",
    cooperative_name: "",
    province: "",
    district: "",
    sector: "",
    farm_size_hectares: "",
    land_ownership: "",
    years_of_experience: "",
    crop_types: [] as string[],
    password: "",
    confirm_password: "",
    agreed: false,
  });

  const update = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  };

  const toggleCrop = (crop: string) => {
    setForm((p) => ({
      ...p,
      crop_types: p.crop_types.includes(crop)
        ? p.crop_types.filter((c) => c !== crop)
        : [...p.crop_types, crop],
    }));
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.full_name.trim()) e.full_name = "Full name is required";
      if (!form.national_id.trim() || form.national_id.length < 16)
        e.national_id = "Enter valid 16-digit national ID";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      if (!/^\+?[\d\s]{10,15}$/.test(form.phone.replace(/\s/g, "")))
        e.phone = "Enter valid phone (e.g. +250788000000)";
      if (!form.email.trim()) e.email = "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Enter valid email address";
      if (!form.gender) e.gender = "Please select gender";
    }
    if (step === 2) {
      if (!form.province) e.province = "Province is required";
      if (!form.district.trim()) e.district = "District is required";
      if (!form.sector.trim()) e.sector = "Sector is required";
    }
    if (step === 3) {
      if (form.role === "farmer") {
        if (!form.farm_size_hectares)
          e.farm_size_hectares = "Farm size is required";
        if (!form.land_ownership)
          e.land_ownership = "Land ownership is required";
        if (form.crop_types.length === 0)
          e.crop_types = "Select at least one crop type";
      }
      if (!form.password) e.password = "Password is required";
      if (form.password.length < 8)
        e.password = "Password must be at least 8 characters";
      if (form.password !== form.confirm_password)
        e.confirm_password = "Passwords do not match";
    }
    if (step === 4) {
      if (!form.agreed) e.agreed = "You must agree to the terms and conditions";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        national_id: form.national_id.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender,
        role: form.role,
        password: form.password,
        cooperative_name: form.cooperative_name.trim() || undefined,
        province: form.province,
        district: form.district.trim(),
        sector: form.sector.trim(),
        farm_size_hectares: form.farm_size_hectares
          ? parseFloat(form.farm_size_hectares)
          : undefined,
        land_ownership: form.land_ownership || undefined,
        years_of_experience: form.years_of_experience
          ? parseInt(form.years_of_experience)
          : undefined,
        crop_types: form.crop_types.length > 0 ? form.crop_types : undefined,
      };
      await authAPI.register(payload);
      setSubmitted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please check your details and try again.";
      toast.error(msg);
      // Go back to step 1 if duplicate email/national_id
      if (
        msg.includes("Email") ||
        msg.includes("National ID") ||
        msg.includes("Phone")
      ) {
        setStep(1);
        if (msg.includes("Email")) setErrors({ email: msg });
        else if (msg.includes("National ID")) setErrors({ national_id: msg });
        else if (msg.includes("Phone")) setErrors({ phone: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-agri-green" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Registration Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Your registration has been submitted for approval. An administrator
            will review your application and notify you via SMS and email within
            24-48 hours.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
            <p className="text-sm font-semibold text-gray-800">
              Application Status:{" "}
              <span className="text-orange-500">Pending Approval</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You will be notified once your account is approved
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full btn-primary py-3"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-agri-green rounded-2xl flex items-center justify-center mb-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            Create New Account
          </h1>
          <p className="text-xs text-agri-green">
            Register for AgriSubsidy System - AGRIFOP
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i + 1 < step ? "bg-agri-green text-white" : i + 1 === step ? "bg-agri-green text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {i + 1 < step ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span className="text-xs mt-1 text-gray-500 hidden sm:block">
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? "bg-agri-green" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.full_name}>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className={`input-field pl-9 ${errors.full_name ? "border-red-400" : ""}`}
                    placeholder="Enter full name"
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                  />
                </div>
              </Field>
              <Field label="National ID *" error={errors.national_id}>
                <div className="relative">
                  <CreditCard
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className={`input-field pl-9 ${errors.national_id ? "border-red-400" : ""}`}
                    placeholder="16-digit national ID"
                    maxLength={16}
                    value={form.national_id}
                    onChange={(e) =>
                      update("national_id", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </Field>
              <Field label="Phone Number *" error={errors.phone}>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className={`input-field pl-9 ${errors.phone ? "border-red-400" : ""}`}
                    placeholder="+250 788 000 000"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Used for SMS notifications
                </p>
              </Field>
              <Field label="Email Address *" error={errors.email}>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    className={`input-field pl-9 ${errors.email ? "border-red-400" : ""}`}
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Gender *" error={errors.gender}>
                <select
                  className={`input-field ${errors.gender ? "border-red-400" : ""}`}
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Register As *" error={errors.role}>
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="farmer">Farmer / Member</option>
                  <option value="cooperative">Cooperative Leader</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
              Location & Cooperative Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Cooperative Name (Optional)"
                  error={errors.cooperative_name}
                >
                  <input
                    className="input-field"
                    placeholder="Enter your cooperative name"
                    value={form.cooperative_name}
                    onChange={(e) => update("cooperative_name", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If your cooperative doesn't exist it will be created
                  </p>
                </Field>
              </div>
              <Field label="Province *" error={errors.province}>
                <div className="relative">
                  <MapPin
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    className={`input-field pl-9 ${errors.province ? "border-red-400" : ""}`}
                    value={form.province}
                    onChange={(e) => update("province", e.target.value)}
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="District *" error={errors.district}>
                <input
                  className={`input-field ${errors.district ? "border-red-400" : ""}`}
                  placeholder="e.g. Musanze"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                />
              </Field>
              <Field label="Sector *" error={errors.sector}>
                <input
                  className={`input-field ${errors.sector ? "border-red-400" : ""}`}
                  placeholder="e.g. Muhoza"
                  value={form.sector}
                  onChange={(e) => update("sector", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 3 — Farm Details + Password */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
              {form.role === "farmer"
                ? "Farm Details & Security"
                : "Account Security"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.role === "farmer" && (
                <>
                  <Field
                    label="Farm Size (Hectares) *"
                    error={errors.farm_size_hectares}
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className={`input-field ${errors.farm_size_hectares ? "border-red-400" : ""}`}
                      placeholder="e.g. 2.5"
                      value={form.farm_size_hectares}
                      onChange={(e) =>
                        update("farm_size_hectares", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Land Ownership *" error={errors.land_ownership}>
                    <select
                      className={`input-field ${errors.land_ownership ? "border-red-400" : ""}`}
                      value={form.land_ownership}
                      onChange={(e) => update("land_ownership", e.target.value)}
                    >
                      <option value="">Select ownership type</option>
                      <option>Owned</option>
                      <option>Leased</option>
                      <option>Community</option>
                      <option>Government</option>
                    </select>
                  </Field>
                  <Field
                    label="Years of Experience"
                    error={errors.years_of_experience}
                  >
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="e.g. 5"
                      value={form.years_of_experience}
                      onChange={(e) =>
                        update("years_of_experience", e.target.value)
                      }
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Crop Types * (Select all that apply)"
                      error={errors.crop_types}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {CROP_TYPES.map((crop) => (
                          <label
                            key={crop}
                            className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-sm transition-colors ${form.crop_types.includes(crop) ? "border-agri-green bg-green-50 text-agri-green" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            <div
                              className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${form.crop_types.includes(crop) ? "border-agri-green bg-agri-green" : "border-gray-300"}`}
                            >
                              {form.crop_types.includes(crop) && (
                                <svg width="8" height="8" viewBox="0 0 8 8">
                                  <path
                                    d="M1 4l2 2 4-4"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    fill="none"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={form.crop_types.includes(crop)}
                              onChange={() => toggleCrop(crop)}
                            />
                            {crop}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                </>
              )}
              <Field label="Password *" error={errors.password}>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    className={`input-field pl-9 pr-9 ${errors.password ? "border-red-400" : ""}`}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password *" error={errors.confirm_password}>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    className={`input-field pl-9 pr-9 ${errors.confirm_password ? "border-red-400" : ""}`}
                    placeholder="Re-enter password"
                    value={form.confirm_password}
                    onChange={(e) => update("confirm_password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
              Review & Submit
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              {[
                { label: "Full Name", value: form.full_name },
                { label: "National ID", value: form.national_id },
                { label: "Email", value: form.email },
                { label: "Phone", value: form.phone },
                {
                  label: "Role",
                  value:
                    form.role === "farmer"
                      ? "Farmer / Member"
                      : "Cooperative Leader",
                },
                {
                  label: "Location",
                  value: [form.sector, form.district, form.province]
                    .filter(Boolean)
                    .join(", "),
                },
                ...(form.cooperative_name
                  ? [{ label: "Cooperative", value: form.cooperative_name }]
                  : []),
                ...(form.role === "farmer"
                  ? [
                      {
                        label: "Farm Size",
                        value: form.farm_size_hectares
                          ? `${form.farm_size_hectares} hectares`
                          : "—",
                      },
                      {
                        label: "Crops",
                        value: form.crop_types.join(", ") || "—",
                      },
                    ]
                  : []),
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{f.label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-xs truncate">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-orange-800 font-medium">
                ⏳ Note: Your account will be <strong>Pending Approval</strong>
              </p>
              <p className="text-xs text-orange-600 mt-1">
                An administrator will review and approve your application within
                24-48 hours before you can log in.
              </p>
            </div>
            <label
              className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${errors.agreed ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-agri-green"}`}
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${form.agreed ? "border-agri-green bg-agri-green" : "border-gray-300"}`}
                onClick={() => update("agreed", !form.agreed)}
              >
                {form.agreed && (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path
                      d="M1 4l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.agreed}
                onChange={(e) => update("agreed", e.target.checked)}
              />
              <span className="text-sm text-gray-600">
                I confirm that all information provided is accurate and agree to
                the terms and conditions of the AgriSubsidy System
              </span>
            </label>
            {errors.agreed && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                {errors.agreed}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary py-3"
            >
              ← Previous
            </button>
          ) : (
            <Link to="/login" className="btn-secondary py-3 text-center">
              ← Back to Login
            </Link>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary py-3"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-agri-green font-medium hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
