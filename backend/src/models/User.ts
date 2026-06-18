import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

export type UserRole = 'admin' | 'cooperative' | 'farmer';
export type UserStatus =
  | 'pending'
  | 'pending_coop_approval'
  | 'pending_admin_approval'
  | 'active'
  | 'suspended'
  | 'rejected';

export interface UserAttributes {
  id: string; full_name: string; national_id: string; email: string;
  phone: string; password_hash: string; pin_hash?: string; role: UserRole;
  gender?: string; status: UserStatus; is_verified: boolean;
  profile_image?: string; last_login?: Date;
  approval_feedback?: string; approved_by?: string;
  approved_at?: Date; rejected_at?: Date;
  registration_cooperative_id?: string;
}

class User extends Model<UserAttributes, Optional<UserAttributes, 'id' | 'is_verified' | 'status'>>
  implements UserAttributes {
  public id!: string; public full_name!: string; public national_id!: string;
  public email!: string; public phone!: string; public password_hash!: string;
  public pin_hash?: string; public role!: UserRole; public gender?: string;
  public status!: UserStatus; public is_verified!: boolean;
  public profile_image?: string; public last_login?: Date;
  public approval_feedback?: string; public approved_by?: string;
  public approved_at?: Date; public rejected_at?: Date;
  public registration_cooperative_id?: string;

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
  async comparePin(pin: string): Promise<boolean> {
    if (!this.pin_hash) return false;
    return bcrypt.compare(pin, this.pin_hash);
  }
  toSafeObject() {
    const obj = this.toJSON() as any;
    delete obj.password_hash;
    delete obj.pin_hash;
    return obj;
  }
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  full_name: { type: DataTypes.STRING(255), allowNull: false },
  national_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  pin_hash: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.STRING(30), allowNull: false },
  gender: { type: DataTypes.STRING(10), allowNull: true },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  profile_image: { type: DataTypes.STRING(500), allowNull: true },
  last_login: { type: DataTypes.DATE, allowNull: true },
  approval_feedback: { type: DataTypes.TEXT, allowNull: true },
  approved_by: { type: DataTypes.UUID, allowNull: true },
  approved_at: { type: DataTypes.DATE, allowNull: true },
  rejected_at: { type: DataTypes.DATE, allowNull: true },
  registration_cooperative_id: { type: DataTypes.UUID, allowNull: true },
}, {
  sequelize,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
  },
});

export default User;
