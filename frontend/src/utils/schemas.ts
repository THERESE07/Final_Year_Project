import { z } from 'zod';

export const registerPayloadSchema = z.object({
  full_name: z.string().min(2),
  national_id: z.string().length(16),
  email: z.string().email(),
  phone: z.string().min(10),
  gender: z.string().min(1),
  role: z.enum(['farmer', 'cooperative', 'admin']).default('farmer'),
  password: z.string().min(8),
  cooperative_id: z.string().uuid().optional().or(z.literal('')),
  cooperative_name: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  farm_size_hectares: z.number().positive().optional(),
  land_ownership: z.string().optional(),
  years_of_experience: z.number().int().min(0).optional(),
  crop_types: z.array(z.string()).optional(),
});

export const loginPayloadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional(),
  login_method: z.enum(['email', 'mobile']).optional(),
});

export const changePasswordPayloadSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

export const cooperativePayloadSchema = z.object({
  name: z.string().min(2),
  registration_number: z.string().optional(),
  province: z.string().min(1),
  district: z.string().min(1),
  sector: z.string().min(1),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  established_year: z.number().int().optional(),
});

export const inputPayloadSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().optional(),
  unit: z.string().min(1),
  unit_price: z.number().nonnegative(),
  subsidized_price: z.number().nonnegative().optional(),
  stock_quantity: z.number().nonnegative(),
  minimum_stock: z.number().nonnegative(),
  supplier: z.string().optional(),
  season: z.string().optional(),
  batch_number: z.string().optional(),
});

export const inputCategoryPayloadSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
});

export const distributionPayloadSchema = z.object({
  farmer_id: z.string().uuid(),
  input_id: z.string().uuid(),
  cooperative_id: z.string().uuid().optional(),
  quantity: z.number().positive(),
  distribution_date: z.string().optional(),
  season: z.string().optional(),
  notes: z.string().optional(),
});

export const subsidyApplicationPayloadSchema = z.object({
  program_id: z.string().uuid(),
  requested_amount: z.number().positive(),
  application_reason: z.string().optional(),
  season: z.string().optional(),
});

export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type CooperativePayload = z.infer<typeof cooperativePayloadSchema>;
export type InputPayload = z.infer<typeof inputPayloadSchema>;
export type DistributionPayload = z.infer<typeof distributionPayloadSchema>;

/** Parse payload and return first error message or null */
export function parsePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; message: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const message = result.error.issues.map((i) => i.message).join('; ');
  return { success: false, message };
}
