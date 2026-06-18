// ============================================================
// utils/validation.ts
// All form validation logic extracted from page components.
//
// WHY: The validateStep() function in RegisterPage.tsx was 60+
// lines of inline logic that made the component harder to read.
// Moving it here makes the rules testable in isolation and keeps
// the component focused on rendering.
// ============================================================

export type ValidationErrors = Record<string, string>;

// ── Registration form ─────────────────────────────────────────

export interface RegisterFormData {
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  gender: string;
  role: string;
  cooperative_id: string;
  cooperative_name: string;
  province: string;
  district: string;
  sector: string;
  farm_size_hectares: string;
  land_ownership: string;
  years_of_experience: string;
  crop_types: string[];
  password: string;
  confirm_password: string;
  agreed: boolean;
  national_id_doc?: File | null;
  authorization_letter?: File | null;
}

export function validateRegistrationStep(
  step: number,
  form: RegisterFormData
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 1) {
    if (!form.full_name.trim())
      errors.full_name = 'Full name is required';

    if (!form.national_id.trim() || form.national_id.length < 16)
      errors.national_id = 'Enter valid 16-digit national ID';

    if (!form.phone.trim())
      errors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s]{10,15}$/.test(form.phone.replace(/\s/g, '')))
      errors.phone = 'Enter valid phone (e.g. +250788000000)';

    if (!form.email.trim())
      errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Enter valid email address';

    if (!form.gender)
      errors.gender = 'Please select gender';
  }

  if (step === 2) {
    if (form.role === 'cooperative' && !form.cooperative_id) {
      errors.cooperative_id = 'Please select your cooperative';
    }
    if (form.role === 'farmer' && !form.cooperative_id && !form.cooperative_name.trim()) {
      errors.cooperative_id = 'Please select or enter your cooperative';
    }
    if (!form.province)  errors.province  = 'Province is required';
    if (!form.district.trim()) errors.district = 'District is required';
    if (!form.sector.trim())   errors.sector   = 'Sector is required';
  }

  if (step === 3) {
    if (form.role === 'farmer') {
      if (!form.farm_size_hectares)
        errors.farm_size_hectares = 'Farm size is required';
      if (!form.land_ownership)
        errors.land_ownership = 'Land ownership is required';
      if (form.crop_types.length === 0)
        errors.crop_types = 'Select at least one crop type';
    }

    if (!form.password)
      errors.password = 'Password is required';
    else if (form.password.length < 8)
      errors.password = 'Password must be at least 8 characters';

    if (form.password !== form.confirm_password)
      errors.confirm_password = 'Passwords do not match';

    if (form.role === 'cooperative') {
      if (!form.national_id_doc) errors.national_id_doc = 'National ID document is required';
      if (!form.authorization_letter) errors.authorization_letter = 'Authorization letter is required';
    }
  }

  if (step === 4) {
    if (!form.agreed)
      errors.agreed = 'You must agree to the terms and conditions';
  }

  return errors;
}

// ── Change-password form ──────────────────────────────────────

export interface ChangePasswordForm {
  current: string;
  new_password: string;
  confirm: string;
}

export function validatePasswordChange(form: ChangePasswordForm): string | null {
  if (!form.current) return 'Enter your current password';
  if (form.new_password.length < 8) return 'New password must be at least 8 characters';
  if (form.new_password !== form.confirm) return 'Passwords do not match';
  return null;
}
