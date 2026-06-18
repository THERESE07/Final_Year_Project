import { Op } from 'sequelize';
import sequelize from '../config/database';
import {
  CooperativeDistributionRequest, CooperativeInputAllocation,
  Cooperative, AgriculturalInput, InputCategory, User, Notification,
} from '../models/associations';
import { buildPagination } from '../utils/response';
import { notifyCoopLeader } from '../utils/notify';
import { sendDistributionEmail } from '../services/email.service';
import logger from '../utils/logger';

export class AllocationService {
  /** Coop leader submits a stock request to admin */
  static async createRequest(coopUserId: string, data: { input_id: string; requested_quantity: number; reason?: string }) {
    const coop = await Cooperative.findOne({ where: { manager_id: coopUserId } });
    if (!coop) throw new Error('No cooperative found for your account');

    const input = await AgriculturalInput.findByPk(data.input_id);
    if (!input || !input.is_active) throw new Error('Input not found or inactive');

    const request = await CooperativeDistributionRequest.create({
      cooperative_id: coop.id,
      input_id: data.input_id,
      requested_quantity: data.requested_quantity,
      reason: data.reason,
      status: 'pending',
    });

    const admins = await User.findAll({ where: { role: 'admin', status: 'active' } });
    await Promise.all(admins.map((a) => Notification.create({
      user_id: a.id,
      title: 'New Cooperative Distribution Request',
      message: `${coop.name} requested ${data.requested_quantity} ${input.unit} of ${input.name}.`,
      type: 'allocation_request',
      related_id: request.id,
      related_type: 'cooperative_distribution_request',
    } as any)));

    return request;
  }

  /** List requests — coop sees own, admin sees all */
  static async listRequests(query: any, userId: string, userRole: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.cooperative_id) where.cooperative_id = query.cooperative_id;

    if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (!coop) return { data: [], pagination: buildPagination(page, limit, 0) };
      where.cooperative_id = coop.id;
    }

    const { count, rows } = await CooperativeDistributionRequest.findAndCountAll({
      where, limit, offset,
      include: [
        { model: AgriculturalInput, as: 'input', attributes: ['name', 'unit'] },
        { model: Cooperative, as: 'cooperative', attributes: ['name', 'district'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return { data: rows, pagination: buildPagination(page, limit, count) };
  }

  /** Admin reviews a cooperative distribution request */
  static async reviewRequest(
    adminId: string,
    requestId: string,
    action: 'approve' | 'reject',
    feedback: string,
    quantity?: number,
  ) {
    const request = await CooperativeDistributionRequest.findByPk(requestId, {
      include: [
        { model: AgriculturalInput, as: 'input' },
        { model: Cooperative, as: 'cooperative' },
      ],
    });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Only pending requests can be reviewed');

    const coop = (request as any).cooperative as Cooperative;
    const input = (request as any).input as AgriculturalInput;
    const manager = coop.manager_id ? await User.findByPk(coop.manager_id) : null;

    if (action === 'reject') {
      await request.update({
        status: 'rejected',
        feedback,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      });
      if (manager) {
        await Notification.create({
          user_id: manager.id,
          title: 'Distribution Request Rejected',
          message: feedback,
          type: 'allocation_request',
          related_id: request.id,
          related_type: 'cooperative_distribution_request',
        } as any);
        await sendDistributionEmail(
          manager.email,
          manager.full_name,
          'Distribution Request Rejected',
          'Your distribution request has been rejected.',
          { Feedback: feedback, Input: input.name },
        );
      }
      return request;
    }

    const allocQty = quantity ?? parseFloat(request.requested_quantity as any);
    const available = parseFloat(input.stock_quantity as any);
    if (available < allocQty) throw new Error(`Insufficient national stock. Available: ${available} ${input.unit}`);

    const allocation = await sequelize.transaction(async (t) => {
      const alloc = await CooperativeInputAllocation.create({
        cooperative_id: request.cooperative_id,
        input_id: request.input_id,
        allocated_quantity: allocQty,
        distributed_quantity: 0,
        status: 'active',
        allocation_date: new Date(),
        approved_by: adminId,
        request_id: request.id,
        notes: feedback,
      }, { transaction: t });

      await input.update({ stock_quantity: available - allocQty }, { transaction: t });
      await request.update({
        status: 'approved',
        feedback,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        allocation_id: alloc.id,
      }, { transaction: t });

      return alloc;
    });

    if (manager) {
      const msg = `Your cooperative has been allocated ${allocQty} ${input.unit} of ${input.name}.`;
      await Notification.create({
        user_id: manager.id,
        title: 'Input Allocation Approved',
        message: `${msg} Feedback: ${feedback}`,
        type: 'allocation',
        related_id: allocation.id,
        related_type: 'cooperative_input_allocation',
      } as any);
      await sendDistributionEmail(
        manager.email,
        manager.full_name,
        'Input Allocation Approved',
        msg,
        { Feedback: feedback, Quantity: `${allocQty} ${input.unit}`, Input: input.name },
      );
    }

    logger.info(`Allocation ${allocation.id} created for coop ${request.cooperative_id}`);
    return { request, allocation };
  }

  /** Admin allocates inputs directly to a cooperative (no prior request) */
  static async createDirectAllocation(
    adminId: string,
    data: { cooperative_id: string; input_id: string; quantity: number; notes: string },
  ) {
    const coop = await Cooperative.findByPk(data.cooperative_id);
    if (!coop) throw new Error('Cooperative not found');

    const input = await AgriculturalInput.findByPk(data.input_id);
    if (!input || !input.is_active) throw new Error('Input not found or inactive');

    const allocQty = data.quantity;
    const available = parseFloat(input.stock_quantity as any);
    if (available < allocQty) throw new Error(`Insufficient national stock. Available: ${available} ${input.unit}`);

    const allocation = await sequelize.transaction(async (t) => {
      const alloc = await CooperativeInputAllocation.create({
        cooperative_id: data.cooperative_id,
        input_id: data.input_id,
        allocated_quantity: allocQty,
        distributed_quantity: 0,
        status: 'active',
        allocation_date: new Date(),
        approved_by: adminId,
        notes: data.notes,
      }, { transaction: t });

      await input.update({ stock_quantity: available - allocQty }, { transaction: t });
      return alloc;
    });

    const manager = coop.manager_id ? await User.findByPk(coop.manager_id) : null;
    if (manager) {
      const msg = `Your cooperative has been allocated ${allocQty} ${input.unit} of ${input.name}.`;
      await Notification.create({
        user_id: manager.id,
        title: 'Input Allocation Received',
        message: `${msg} Notes: ${data.notes}`,
        type: 'allocation',
        related_id: allocation.id,
        related_type: 'cooperative_input_allocation',
      } as any);
      await sendDistributionEmail(
        manager.email,
        manager.full_name,
        'Input Allocation Received',
        msg,
        { Notes: data.notes, Quantity: `${allocQty} ${input.unit}`, Input: input.name },
      );
    }

    logger.info(`Direct allocation ${allocation.id} created for coop ${data.cooperative_id}`);
    return allocation;
  }

  /** Admin allocation tracking (cooperative-level, no farmers) */
  static async listAllocations(query: any, userId: string, userRole: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (query.cooperative_id) where.cooperative_id = query.cooperative_id;
    if (query.status) where.status = query.status;

    if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (!coop) return { data: [], pagination: buildPagination(page, limit, 0) };
      where.cooperative_id = coop.id;
    }

    const { count, rows } = await CooperativeInputAllocation.findAndCountAll({
      where, limit, offset,
      include: [
        { model: AgriculturalInput, as: 'input', attributes: ['name', 'unit'], include: [{ model: InputCategory, as: 'category', attributes: ['name'] }] },
        { model: Cooperative, as: 'cooperative', attributes: ['name', 'district', 'province'] },
      ],
      order: [['allocation_date', 'DESC']],
    });

    const enriched = rows.map((a) => {
      const allocated = parseFloat(a.allocated_quantity as any);
      const distributed = parseFloat(a.distributed_quantity as any);
      return {
        ...a.toJSON(),
        quantity_remaining: allocated - distributed,
      };
    });

    return { data: enriched, pagination: buildPagination(page, limit, count) };
  }

  /** Coop inventory — only inputs allocated to this cooperative */
  static async getCooperativeInventory(coopUserId: string) {
    const coop = await Cooperative.findOne({ where: { manager_id: coopUserId } });
    if (!coop) return [];

    const allocations = await CooperativeInputAllocation.findAll({
      where: { cooperative_id: coop.id, status: { [Op.in]: ['active', 'depleted'] } },
      include: [
        { model: AgriculturalInput, as: 'input', attributes: ['name', 'unit', 'supplier'], include: [{ model: InputCategory, as: 'category', attributes: ['name'] }] },
      ],
      order: [['allocation_date', 'DESC']],
    });

    return allocations.map((a) => {
      const allocated = parseFloat(a.allocated_quantity as any);
      const distributed = parseFloat(a.distributed_quantity as any);
      return {
        allocation_id: a.id,
        input_id: a.input_id,
        input_name: (a as any).input?.name,
        category: (a as any).input?.category?.name,
        unit: (a as any).input?.unit,
        allocated_quantity: allocated,
        distributed_quantity: distributed,
        remaining_quantity: allocated - distributed,
        allocation_date: a.allocation_date,
        status: a.status,
      };
    });
  }

  /** Deduct from coop allocation when distributing to farmer */
  static async deductFromAllocation(cooperativeId: string, inputId: string, quantity: number, transaction?: any) {
    const allocation = await CooperativeInputAllocation.findOne({
      where: {
        cooperative_id: cooperativeId,
        input_id: inputId,
        status: 'active',
      },
      order: [['allocation_date', 'ASC']],
      transaction,
    });
    if (!allocation) throw new Error('No active allocation found for this input in your cooperative inventory');

    const allocated = parseFloat(allocation.allocated_quantity as any);
    const distributed = parseFloat(allocation.distributed_quantity as any);
    const remaining = allocated - distributed;
    if (remaining < quantity) {
      throw new Error(`Insufficient cooperative stock. Remaining: ${remaining}, Requested: ${quantity}`);
    }

    const newDistributed = distributed + quantity;
    await allocation.update({
      distributed_quantity: newDistributed,
      status: newDistributed >= allocated ? 'depleted' : 'active',
    }, { transaction });

    return allocation;
  }
}
