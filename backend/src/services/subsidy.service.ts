import { Op } from 'sequelize';
import sequelize from '../config/database';
import { SubsidyProgram, SubsidyApplication, Farmer, User, Cooperative, Notification } from '../models/associations';
import { buildPagination } from '../utils/response';

export class SubsidyService {
  static async createProgram(data: any, createdBy: string) {
    const program = await SubsidyProgram.create({ ...data, created_by: createdBy, status: 'draft' });
    return program;
  }

  static async getAllPrograms(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { count, rows } = await SubsidyProgram.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
    });
    return { data: rows, pagination: buildPagination(page, limit, count) };
  }

  static async applyForSubsidy(data: any, userId: string) {
    const farmer = await Farmer.findOne({ where: { user_id: userId } });
    if (!farmer) throw new Error('Farmer profile not found');

    const program = await SubsidyProgram.findByPk(data.program_id);
    if (!program) throw new Error('Subsidy program not found');
    if (program.status !== 'active') throw new Error('This subsidy program is not currently accepting applications');

    // Check for duplicate application
    const existing = await SubsidyApplication.findOne({
      where: { program_id: data.program_id, farmer_id: farmer.id, status: { [Op.notIn]: ['cancelled', 'rejected'] } },
    });
    if (existing) throw new Error('You have already applied for this subsidy program');

    // Check max amount
    if (program.max_amount_per_farmer && data.requested_amount > program.max_amount_per_farmer) {
      throw new Error(`Requested amount exceeds maximum allowed: RWF ${program.max_amount_per_farmer.toLocaleString()}`);
    }

    // Check remaining budget
    const remaining = parseFloat(program.total_budget as any) - parseFloat(program.allocated_budget as any);
    if (data.requested_amount > remaining) {
      throw new Error(`Insufficient budget remaining: RWF ${remaining.toLocaleString()}`);
    }

    const application = await SubsidyApplication.create({
      program_id: data.program_id,
      farmer_id: farmer.id,
      cooperative_id: farmer.cooperative_id,
      requested_amount: data.requested_amount,
      application_reason: data.application_reason,
      status: 'pending',
      disbursed_amount: 0,
    });

    // Notify admins
    const admins = await User.findAll({ where: { role: 'admin', status: 'active' } });
    await Promise.all(admins.map(admin =>
      Notification.create({
        user_id: admin.id,
        title: 'New Subsidy Application',
        message: `A new subsidy application for ${program.name} has been submitted.`,
        type: 'subsidy',
        related_id: application.id,
        related_type: 'subsidy_application',
      } as any)
    ));

    return application;
  }

  static async reviewApplication(id: string, action: 'approve' | 'reject', data: any, reviewerId: string) {
    const application = await SubsidyApplication.findByPk(id, {
      include: [
        { model: SubsidyProgram, as: 'program' },
        { model: Farmer, as: 'farmer', include: [{ model: User, as: 'user' }] },
      ],
    });
    if (!application) throw new Error('Application not found');
    if (!['pending', 'under_review'].includes(application.status)) {
      throw new Error('Application cannot be reviewed in its current status');
    }

    const program = (application as any).program as SubsidyProgram;

    if (action === 'approve') {
      const approvedAmount = data.approved_amount || application.requested_amount;

      // Check budget
      const remaining = parseFloat(program.total_budget as any) - parseFloat(program.allocated_budget as any);
      if (approvedAmount > remaining) throw new Error('Insufficient program budget');

      await application.update({
        status: 'approved',
        approved_amount: approvedAmount,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      });

      // Update program budget
      await program.update({
        allocated_budget: parseFloat(program.allocated_budget as any) + parseFloat(approvedAmount),
      });

    } else {
      await application.update({
        status: 'rejected',
        rejection_reason: data.rejection_reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      });
    }

    // Notify farmer
    const farmer = (application as any).farmer as Farmer;
    const user = (farmer as any).user as User;
    if (user) {
      await Notification.create({
        user_id: user.id,
        title: action === 'approve' ? 'Subsidy Application Approved' : 'Subsidy Application Rejected',
        message: action === 'approve'
          ? `Your subsidy application has been approved for RWF ${(application.approved_amount || 0).toLocaleString()}`
          : `Your subsidy application was rejected. Reason: ${data.rejection_reason}`,
        type: 'subsidy',
        related_id: application.id,
        related_type: 'subsidy_application',
      } as any);
    }

    return application;
  }

  static async disburse(id: string, data: any, disbursedBy: string) {
    const application = await SubsidyApplication.findByPk(id, {
      include: [{ model: Farmer, as: 'farmer', include: [{ model: User, as: 'user' }] }],
    });
    if (!application) throw new Error('Application not found');
    if (application.status !== 'approved') throw new Error('Only approved applications can be disbursed');

    const newDisbursed = parseFloat(application.disbursed_amount as any) + parseFloat(data.amount);
    const isFullyDisbursed = newDisbursed >= parseFloat(application.approved_amount as any);

    await application.update({
      disbursed_amount: newDisbursed,
      status: isFullyDisbursed ? 'disbursed' : 'approved',
      disbursement_method: data.method,
      disbursement_reference: data.reference,
      disbursement_date: new Date(),
    });

    // Update program disbursed budget
    await SubsidyProgram.increment('disbursed_budget', {
      by: parseFloat(data.amount),
      where: { id: (await SubsidyApplication.findByPk(id))!.program_id },
    });

    // Notify farmer
    const farmer = (application as any).farmer as Farmer;
    const user = (farmer as any)?.user as User;
    if (user) {
      await Notification.create({
        user_id: user.id,
        title: 'Subsidy Disbursed',
        message: `RWF ${parseFloat(data.amount).toLocaleString()} has been disbursed to your account via ${data.method}.`,
        type: 'subsidy',
        related_id: application.id,
        related_type: 'subsidy_application',
      } as any);
    }

    return application;
  }

  static async getApplications(query: any, userId?: string, userRole?: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.program_id) where.program_id = query.program_id;

    // Farmers see only their own applications
    if (userRole === 'farmer') {
      const farmer = await Farmer.findOne({ where: { user_id: userId } });
      if (farmer) where.farmer_id = farmer.id;
    }

    const { count, rows } = await SubsidyApplication.findAndCountAll({
      where, limit, offset,
      include: [
        { model: SubsidyProgram, as: 'program', attributes: ['name', 'type'] },
        {
          model: Farmer, as: 'farmer',
          include: [{ model: User, as: 'user', attributes: ['full_name', 'phone', 'email'] }],
        },
        { model: Cooperative, as: 'cooperative', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return { data: rows, pagination: buildPagination(page, limit, count) };
  }
}
