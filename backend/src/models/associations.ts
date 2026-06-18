import User from './User';
import Cooperative from './Cooperative';
import {
  Farmer, InputCategory, AgriculturalInput,
  SubsidyProgram, SubsidyApplication,
  InputDistribution, Notification, RefreshToken, AuditLog,
  InputRequest, UserDocument,
  CooperativeDistributionRequest, CooperativeInputAllocation,
} from './index';

export const setupAssociations = (): void => {
  User.hasOne(Cooperative, { foreignKey: 'manager_id', as: 'managed_cooperative', constraints: false });
  Cooperative.belongsTo(User, { foreignKey: 'manager_id', as: 'manager', constraints: false });
  User.belongsTo(Cooperative, { foreignKey: 'registration_cooperative_id', as: 'registration_cooperative', constraints: false });

  User.hasOne(Farmer, { foreignKey: 'user_id', as: 'farmer_profile' });
  Farmer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Cooperative.hasMany(Farmer, { foreignKey: 'cooperative_id', as: 'farmers', constraints: false });
  Farmer.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });

  InputCategory.hasMany(AgriculturalInput, { foreignKey: 'category_id', as: 'inputs', constraints: false });
  AgriculturalInput.belongsTo(InputCategory, { foreignKey: 'category_id', as: 'category', constraints: false });

  SubsidyProgram.hasMany(SubsidyApplication, { foreignKey: 'program_id', as: 'applications' });
  SubsidyApplication.belongsTo(SubsidyProgram, { foreignKey: 'program_id', as: 'program' });

  Farmer.hasMany(SubsidyApplication, { foreignKey: 'farmer_id', as: 'subsidy_applications' });
  SubsidyApplication.belongsTo(Farmer, { foreignKey: 'farmer_id', as: 'farmer' });

  Cooperative.hasMany(SubsidyApplication, { foreignKey: 'cooperative_id', as: 'subsidy_applications', constraints: false });
  SubsidyApplication.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });

  Farmer.hasMany(InputDistribution, { foreignKey: 'farmer_id', as: 'distributions' });
  InputDistribution.belongsTo(Farmer, { foreignKey: 'farmer_id', as: 'farmer' });

  Cooperative.hasMany(InputDistribution, { foreignKey: 'cooperative_id', as: 'distributions', constraints: false });
  InputDistribution.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });

  AgriculturalInput.hasMany(InputDistribution, { foreignKey: 'input_id', as: 'distributions' });
  InputDistribution.belongsTo(AgriculturalInput, { foreignKey: 'input_id', as: 'input' });

  InputDistribution.belongsTo(CooperativeInputAllocation, { foreignKey: 'allocation_id', as: 'allocation', constraints: false });
  CooperativeInputAllocation.hasMany(InputDistribution, { foreignKey: 'allocation_id', as: 'distributions', constraints: false });

  Farmer.hasMany(InputRequest, { foreignKey: 'farmer_id', as: 'input_requests' });
  InputRequest.belongsTo(Farmer, { foreignKey: 'farmer_id', as: 'farmer' });
  Cooperative.hasMany(InputRequest, { foreignKey: 'cooperative_id', as: 'input_requests', constraints: false });
  InputRequest.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });
  AgriculturalInput.hasMany(InputRequest, { foreignKey: 'input_id', as: 'input_requests', constraints: false });
  InputRequest.belongsTo(AgriculturalInput, { foreignKey: 'input_id', as: 'input' });
  InputRequest.belongsTo(InputDistribution, { foreignKey: 'distribution_id', as: 'distribution', constraints: false });

  Cooperative.hasMany(CooperativeDistributionRequest, { foreignKey: 'cooperative_id', as: 'distribution_requests', constraints: false });
  CooperativeDistributionRequest.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });
  AgriculturalInput.hasMany(CooperativeDistributionRequest, { foreignKey: 'input_id', as: 'coop_distribution_requests', constraints: false });
  CooperativeDistributionRequest.belongsTo(AgriculturalInput, { foreignKey: 'input_id', as: 'input', constraints: false });
  CooperativeDistributionRequest.belongsTo(CooperativeInputAllocation, { foreignKey: 'allocation_id', as: 'allocation', constraints: false });

  Cooperative.hasMany(CooperativeInputAllocation, { foreignKey: 'cooperative_id', as: 'input_allocations', constraints: false });
  CooperativeInputAllocation.belongsTo(Cooperative, { foreignKey: 'cooperative_id', as: 'cooperative', constraints: false });
  AgriculturalInput.hasMany(CooperativeInputAllocation, { foreignKey: 'input_id', as: 'coop_allocations', constraints: false });
  CooperativeInputAllocation.belongsTo(AgriculturalInput, { foreignKey: 'input_id', as: 'input', constraints: false });
  CooperativeInputAllocation.belongsTo(CooperativeDistributionRequest, { foreignKey: 'request_id', as: 'request', constraints: false });

  User.hasMany(UserDocument, { foreignKey: 'user_id', as: 'documents' });
  UserDocument.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
  RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

export {
  User, Cooperative, Farmer, InputCategory, AgriculturalInput,
  SubsidyProgram, SubsidyApplication, InputDistribution,
  Notification, RefreshToken, AuditLog, InputRequest, UserDocument,
  CooperativeDistributionRequest, CooperativeInputAllocation,
};
