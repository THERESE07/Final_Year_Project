import { Op } from 'sequelize';
import sequelize from '../config/database';
import { User, Farmer, Cooperative, UserDocument } from '../models/associations';
import { notifyUser } from '../utils/notify';
import { buildPagination } from '../utils/response';
import { deleteRejectedApplicant, notifyApprovalWithEmail } from '../utils/user-cleanup';
import logger from '../utils/logger';

export class FarmerApprovalService {
  static async getPendingFarmers(coopLeaderId: string, query: any) {
    const coop = await Cooperative.findOne({ where: { manager_id: coopLeaderId } });
    if (!coop) throw new Error('No cooperative found for your account');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const farmerUserIds = await Farmer.findAll({
      where: { cooperative_id: coop.id },
      attributes: ['user_id'],
    });
    const userIds = farmerUserIds.map((f) => f.user_id);

    const where: any = {
      id: { [Op.in]: userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'] },
      role: 'farmer',
      status: 'pending_coop_approval',
    };

    if (query.search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { phone: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      attributes: { exclude: ['password_hash', 'pin_hash'] },
      include: [{
        model: Farmer,
        as: 'farmer_profile',
        include: [{ model: Cooperative, as: 'cooperative', attributes: ['name'] }],
      }],
      order: [['created_at', 'DESC']],
    });

    return { data: rows, pagination: buildPagination(page, limit, count) };
  }

  static async reviewFarmer(coopLeaderId: string, userId: string, action: 'approve' | 'reject', feedback: string) {
    if (!feedback?.trim()) throw new Error('Feedback is required');

    const coop = await Cooperative.findOne({ where: { manager_id: coopLeaderId } });
    if (!coop) throw new Error('No cooperative found for your account');

    const user = await User.findByPk(userId, {
      include: [{ model: Farmer, as: 'farmer_profile' }],
    });
    if (!user) throw new Error('User not found');
    if (user.role !== 'farmer') throw new Error('User is not a farmer');
    if (user.status !== 'pending_coop_approval') throw new Error('Farmer is not pending cooperative approval');

    const farmer = (user as any).farmer_profile as Farmer | undefined;
    if (!farmer || farmer.cooperative_id !== coop.id) {
      throw new Error('This farmer does not belong to your cooperative');
    }

    if (action === 'reject') {
      await deleteRejectedApplicant(user, feedback);
      return { deleted: true, message: 'Farmer registration rejected and removed' };
    }

    await user.update({
      status: 'active',
      approval_feedback: feedback,
      approved_by: coopLeaderId,
      approved_at: new Date(),
    });
    await notifyApprovalWithEmail(user, 'Registration Approved', feedback, feedback);
    logger.info(`Farmer ${user.email} approved by coop leader ${coopLeaderId}`);
    return user.toSafeObject();
  }

  static async getPendingCount(coopLeaderId: string) {
    const coop = await Cooperative.findOne({ where: { manager_id: coopLeaderId } });
    if (!coop) return 0;

    const farmers = await Farmer.findAll({
      where: { cooperative_id: coop.id },
      attributes: ['user_id'],
    });
    if (!farmers.length) return 0;

    return User.count({
      where: {
        id: { [Op.in]: farmers.map((f) => f.user_id) },
        role: 'farmer',
        status: 'pending_coop_approval',
      },
    });
  }
}

export class AdminUserReviewService {
  static async reviewUser(adminId: string, userId: string, action: 'approve' | 'reject', feedback: string) {
    if (!feedback?.trim()) throw new Error('Feedback is required');

    const user = await User.findByPk(userId, {
      include: [
        { model: UserDocument, as: 'documents' },
        { model: Farmer, as: 'farmer_profile' },
      ],
    });
    if (!user) throw new Error('User not found');

    const reviewableStatuses = ['pending', 'pending_admin_approval'];
    if (!reviewableStatuses.includes(user.status)) {
      throw new Error('User is not pending admin approval');
    }

    if (action === 'reject') {
      await deleteRejectedApplicant(user, feedback);
      return { deleted: true, message: 'Application rejected and removed' };
    }

    await sequelize.transaction(async (t) => {
      if (user.role === 'cooperative' && user.registration_cooperative_id) {
        const coop = await Cooperative.findByPk(user.registration_cooperative_id, { transaction: t });
        if (!coop) throw new Error('Registered cooperative not found');
        if (coop.manager_id) throw new Error('This cooperative already has a manager');
        await coop.update({ manager_id: user.id }, { transaction: t });
      }

      await user.update({
        status: 'active',
        approval_feedback: feedback,
        approved_by: adminId,
        approved_at: new Date(),
      }, { transaction: t });
    });

    await notifyApprovalWithEmail(user, 'Account Approved', feedback, feedback);
    logger.info(`User ${user.email} approved by admin ${adminId}`);
    return user.toSafeObject();
  }

  static async getUserWithDocuments(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'pin_hash'] },
      include: [
        { model: UserDocument, as: 'documents' },
        {
          model: Farmer,
          as: 'farmer_profile',
          include: [{ model: Cooperative, as: 'cooperative', attributes: ['name'] }],
        },
        { model: Cooperative, as: 'registration_cooperative', attributes: ['name', 'province', 'district'] },
      ],
    });
    if (!user) throw new Error('User not found');
    return user.toSafeObject();
  }
}
