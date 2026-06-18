import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CooperativeAttributes {
  id: string; name: string; registration_number?: string;
  province: string; district: string; sector: string;
  cell?: string; village?: string; contact_person?: string;
  contact_phone?: string; contact_email?: string; description?: string;
  established_year?: number; status: string; manager_id?: string;
}

class Cooperative extends Model<CooperativeAttributes, Optional<CooperativeAttributes, 'id' | 'status'>>
  implements CooperativeAttributes {
  public id!: string; public name!: string; public registration_number?: string;
  public province!: string; public district!: string; public sector!: string;
  public cell?: string; public village?: string; public contact_person?: string;
  public contact_phone?: string; public contact_email?: string;
  public description?: string; public established_year?: number;
  public status!: string; public manager_id?: string;
}

Cooperative.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  registration_number: { type: DataTypes.STRING(100), allowNull: true },
  province: { type: DataTypes.STRING(100), allowNull: false },
  district: { type: DataTypes.STRING(100), allowNull: false },
  sector: { type: DataTypes.STRING(100), allowNull: false },
  cell: { type: DataTypes.STRING(100), allowNull: true },
  village: { type: DataTypes.STRING(100), allowNull: true },
  contact_person: { type: DataTypes.STRING(255), allowNull: true },
  contact_phone: { type: DataTypes.STRING(20), allowNull: true },
  contact_email: { type: DataTypes.STRING(255), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  established_year: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
  manager_id: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'cooperatives' });

export default Cooperative;
