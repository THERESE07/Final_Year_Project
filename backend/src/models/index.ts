import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// =================== FARMER ===================
export class Farmer extends Model {
  public id!: string; public user_id!: string; public cooperative_id?: string;
  public farmer_code!: string; public farm_size_hectares?: number;
  public land_ownership?: string; public years_of_experience?: number;
  public crop_types?: string[]; public province?: string; public district?: string;
  public sector?: string; public cell?: string; public village?: string;
  public bank_account?: string; public mobile_money?: string;
  public gps_latitude?: number; public gps_longitude?: number;
}
Farmer.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  cooperative_id: { type: DataTypes.UUID, allowNull: true },
  farmer_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  farm_size_hectares: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  land_ownership: { type: DataTypes.STRING(50), allowNull: true },
  years_of_experience: { type: DataTypes.INTEGER, allowNull: true },
  crop_types: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
  province: { type: DataTypes.STRING(100), allowNull: true },
  district: { type: DataTypes.STRING(100), allowNull: true },
  sector: { type: DataTypes.STRING(100), allowNull: true },
  cell: { type: DataTypes.STRING(100), allowNull: true },
  village: { type: DataTypes.STRING(100), allowNull: true },
  bank_account: { type: DataTypes.STRING(100), allowNull: true },
  mobile_money: { type: DataTypes.STRING(20), allowNull: true },
  gps_latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  gps_longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
}, { sequelize, tableName: 'farmers' });

// =================== INPUT CATEGORY ===================
export class InputCategory extends Model {
  public id!: string; public name!: string;
  public description?: string; public unit!: string;
}
InputCategory.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  unit: { type: DataTypes.STRING(30), allowNull: false },
}, { sequelize, tableName: 'input_categories' });

// =================== AGRICULTURAL INPUT ===================
export class AgriculturalInput extends Model {
  public id!: string; public name!: string; public category_id?: string;
  public description?: string; public unit!: string; public unit_price!: number;
  public subsidized_price?: number; public stock_quantity!: number;
  public minimum_stock!: number; public supplier?: string;
  public batch_number?: string; public expiry_date?: Date;
  public season?: string; public is_active!: boolean; public created_by?: string;
}
AgriculturalInput.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  category_id: { type: DataTypes.UUID, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  unit: { type: DataTypes.STRING(30), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  subsidized_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  stock_quantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  minimum_stock: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  supplier: { type: DataTypes.STRING(255), allowNull: true },
  batch_number: { type: DataTypes.STRING(100), allowNull: true },
  expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
  season: { type: DataTypes.STRING(50), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'agricultural_inputs' });

// =================== SUBSIDY PROGRAM ===================
export class SubsidyProgram extends Model {
  public id!: string; public name!: string; public description?: string;
  public type!: string; public total_budget!: number; public allocated_budget!: number;
  public disbursed_budget!: number; public season?: string;
  public start_date?: Date; public end_date?: Date;
  public eligibility_criteria?: object; public max_amount_per_farmer?: number;
  public status!: string; public created_by?: string;
}
SubsidyProgram.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.STRING(20), defaultValue: 'cash' },
  total_budget: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  allocated_budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  disbursed_budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  season: { type: DataTypes.STRING(50), allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
  eligibility_criteria: { type: DataTypes.JSONB, allowNull: true },
  max_amount_per_farmer: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  status: { type: DataTypes.STRING(20), defaultValue: 'draft' },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'subsidy_programs' });

// =================== SUBSIDY APPLICATION ===================
// NOTE: No named unique index here — Sequelize handles it via unique:true on the field
export class SubsidyApplication extends Model {
  public id!: string; public program_id!: string; public farmer_id!: string;
  public cooperative_id?: string; public requested_amount!: number;
  public approved_amount?: number; public disbursed_amount!: number;
  public status!: string; public application_reason?: string;
  public rejection_reason?: string; public disbursement_method?: string;
  public disbursement_reference?: string; public disbursement_date?: Date;
  public reviewed_by?: string; public reviewed_at?: Date;
}
SubsidyApplication.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  program_id: { type: DataTypes.UUID, allowNull: false },
  farmer_id: { type: DataTypes.UUID, allowNull: false },
  cooperative_id: { type: DataTypes.UUID, allowNull: true },
  requested_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  approved_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  disbursed_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
  application_reason: { type: DataTypes.TEXT, allowNull: true },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  disbursement_method: { type: DataTypes.STRING(50), allowNull: true },
  disbursement_reference: { type: DataTypes.STRING(255), allowNull: true },
  disbursement_date: { type: DataTypes.DATE, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, tableName: 'subsidy_applications' });

// =================== INPUT DISTRIBUTION ===================
export class InputDistribution extends Model {
  public id!: string; public farmer_id!: string; public cooperative_id?: string;
  public input_id!: string; public quantity!: number; public unit_price!: number;
  public total_amount!: number; public distribution_date!: Date; public season?: string;
  public status!: string; public qr_code?: string; public notes?: string;
  public approved_by?: string; public distributed_by?: string;
  public allocation_id?: string;
}
InputDistribution.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  farmer_id: { type: DataTypes.UUID, allowNull: false },
  cooperative_id: { type: DataTypes.UUID, allowNull: true },
  input_id: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  distribution_date: { type: DataTypes.DATEONLY, allowNull: false },
  season: { type: DataTypes.STRING(50), allowNull: true },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
  qr_code: { type: DataTypes.STRING(500), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  approved_by: { type: DataTypes.UUID, allowNull: true },
  distributed_by: { type: DataTypes.UUID, allowNull: true },
  allocation_id: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'input_distributions' });

// =================== NOTIFICATION ===================
export class Notification extends Model {
  public id!: string; public user_id!: string; public title!: string;
  public message!: string; public type!: string;
  public is_read!: boolean; public related_id?: string; public related_type?: string;
}
Notification.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING(30), defaultValue: 'info' },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  related_id: { type: DataTypes.UUID, allowNull: true },
  related_type: { type: DataTypes.STRING(50), allowNull: true },
}, { sequelize, tableName: 'notifications' });

// =================== REFRESH TOKEN ===================
export class RefreshToken extends Model {
  public id!: string; public user_id!: string; public token!: string;
  public expires_at!: Date; public is_revoked!: boolean;
}
RefreshToken.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'refresh_tokens' });

// =================== AUDIT LOG ===================
export class AuditLog extends Model {
  public id!: string; public user_id?: string; public action!: string;
  public entity_type?: string; public entity_id?: string;
  public old_values?: object; public new_values?: object; public ip_address?: string;
}
AuditLog.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(100), allowNull: true },
  entity_id: { type: DataTypes.UUID, allowNull: true },
  old_values: { type: DataTypes.JSONB, allowNull: true },
  new_values: { type: DataTypes.JSONB, allowNull: true },
  ip_address: { type: DataTypes.STRING(50), allowNull: true },
}, { sequelize, tableName: 'audit_logs' });

// =================== INPUT REQUEST ===================
export class InputRequest extends Model {
  public id!: string; public farmer_id!: string; public cooperative_id!: string;
  public input_id!: string; public quantity!: number; public reason?: string;
  public status!: string; public season?: string; public notes?: string;
  public reviewed_by?: string; public reviewed_at?: Date;
  public rejection_reason?: string; public distribution_id?: string;
}
InputRequest.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  farmer_id: { type: DataTypes.UUID, allowNull: false },
  cooperative_id: { type: DataTypes.UUID, allowNull: false },
  input_id: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
  season: { type: DataTypes.STRING(50), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  distribution_id: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'input_requests' });

// =================== USER DOCUMENT ===================
export class UserDocument extends Model {
  public id!: string; public user_id!: string; public document_type!: string;
  public file_name!: string; public file_path!: string;
  public mime_type?: string; public file_size?: number;
}
UserDocument.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  document_type: { type: DataTypes.STRING(50), allowNull: false },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  file_path: { type: DataTypes.STRING(500), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: true },
  file_size: { type: DataTypes.INTEGER, allowNull: true },
}, { sequelize, tableName: 'user_documents' });

// =================== COOP DISTRIBUTION REQUEST (coop → admin) ===================
export class CooperativeDistributionRequest extends Model {
  public id!: string; public cooperative_id!: string; public input_id!: string;
  public requested_quantity!: number; public reason?: string; public status!: string;
  public feedback?: string; public reviewed_by?: string; public reviewed_at?: Date;
  public allocation_id?: string;
}
CooperativeDistributionRequest.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cooperative_id: { type: DataTypes.UUID, allowNull: false },
  input_id: { type: DataTypes.UUID, allowNull: false },
  requested_quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  allocation_id: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'cooperative_distribution_requests' });

// =================== COOP INPUT ALLOCATION (admin → coop inventory) ===================
export class CooperativeInputAllocation extends Model {
  public id!: string; public cooperative_id!: string; public input_id!: string;
  public allocated_quantity!: number; public distributed_quantity!: number;
  public status!: string; public allocation_date!: Date;
  public approved_by?: string; public request_id?: string; public notes?: string;
}
CooperativeInputAllocation.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cooperative_id: { type: DataTypes.UUID, allowNull: false },
  input_id: { type: DataTypes.UUID, allowNull: false },
  allocated_quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  distributed_quantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING(30), defaultValue: 'active' },
  allocation_date: { type: DataTypes.DATEONLY, allowNull: false },
  approved_by: { type: DataTypes.UUID, allowNull: true },
  request_id: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'cooperative_input_allocations' });

export default Farmer;
