import { z } from 'zod';

const uuid = z.string().uuid();
const phone = z.string().min(10).max(15);
const email = z.string().email();

export const registerSchema = z.object({
  full_name: z.string().min(2).max(150),
  national_id: z.string().min(16).max(16),
  email: email,
  phone: phone,
  gender: z.string().min(1),
  role: z.enum(['farmer', 'cooperative', 'admin']).default('farmer'),
  password: z.string().min(8),
  cooperative_id: uuid.optional(),
  cooperative_name: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  farm_size_hectares: z.number().positive().optional(),
  land_ownership: z.string().optional(),
  years_of_experience: z.number().int().min(0).optional(),
  crop_types: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'cooperative' && !data.cooperative_id) {
    ctx.addIssue({ code: 'custom', message: 'Cooperative selection is required for cooperative leaders', path: ['cooperative_id'] });
  }
});

export const loginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional(),
  login_method: z.enum(['email', 'mobile']).optional(),
}).refine(
  (d) => (d.login_method === 'mobile' ? d.phone && d.pin : d.email && d.password),
  { message: 'Provide email/password or phone/pin' },
);

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'pending_coop_approval', 'pending_admin_approval', 'suspended', 'rejected']),
  feedback: z.string().optional(),
});

export const userReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().min(1, 'Feedback is required'),
});

export const farmerReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().min(1, 'Feedback is required'),
});

export const inputRequestSchema = z.object({
  input_id: uuid,
  quantity: z.number().positive(),
  reason: z.string().optional(),
  season: z.string().optional(),
});

export const inputRequestReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().min(1, 'Feedback is required'),
  quantity: z.coerce.number().positive().optional(),
});

export const coopDistributionRequestSchema = z.object({
  input_id: uuid,
  requested_quantity: z.coerce.number().positive(),
  reason: z.string().optional(),
});

export const coopDistributionRequestReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().min(1, 'Feedback is required'),
  quantity: z.coerce.number().positive().optional(),
});

export const directAllocationSchema = z.object({
  cooperative_id: uuid,
  input_id: uuid,
  quantity: z.coerce.number().positive(),
  notes: z.string().min(1, 'Feedback is required'),
});

export const cooperativeSchema = z.object({
  name: z.string().min(2),
  registration_number: z.string().optional(),
  province: z.string().min(1),
  district: z.string().min(1),
  sector: z.string().min(1),
  contact_person: z.string().optional(),
  contact_phone: phone.optional(),
  contact_email: email.optional(),
  description: z.string().optional(),
  established_year: z.number().int().min(1900).max(2100).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const inputCategorySchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
});

export const agriculturalInputSchema = z.object({
  name: z.string().min(1),
  category_id: uuid.optional(),
  description: z.string().optional(),
  unit: z.string().min(1),
  unit_price: z.number().nonnegative(),
  subsidized_price: z.number().nonnegative().optional(),
  stock_quantity: z.number().nonnegative().default(0),
  minimum_stock: z.number().nonnegative().default(0),
  supplier: z.string().optional(),
  season: z.string().optional(),
  batch_number: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const subsidyProgramSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  total_budget: z.number().positive(),
  season: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  eligibility_criteria: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['active', 'inactive', 'closed']).optional(),
});

export const subsidyApplicationSchema = z.object({
  program_id: uuid,
  requested_amount: z.number().positive(),
  application_reason: z.string().optional(),
  season: z.string().optional(),
});

export const subsidyReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  approved_amount: z.coerce.number().nonnegative().optional(),
  rejection_reason: z.string().optional(),
});

export const subsidyDisburseSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
});

export const distributionSchema = z.object({
  farmer_id: uuid,
  input_id: uuid,
  cooperative_id: uuid.optional(),
  quantity: z.number().positive(),
  distribution_date: z.string().optional(),
  season: z.string().optional(),
  notes: z.string().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  province: z.string().optional(),
  category_id: uuid.optional(),
  season: z.string().optional(),
});
