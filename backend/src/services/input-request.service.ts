import {
  InputRequest, Farmer, Cooperative, AgriculturalInput, User,
} from '../models/associations';
import { InputService } from './input.service';
import { notifyCoopLeader, notifyUser } from '../utils/notify';
import { buildPagination } from '../utils/response';
import logger from '../utils/logger';

export class InputRequestService {
  static async create(userId: string, data: { input_id: string; quantity: number; reason?: string; season?: string }) {
    const farmer = await Farmer.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'status', 'full_name'] }],
    });
    if (!farmer) throw new Error('Farmer profile not found');
    if (!(farmer as any).user || (farmer as any).user.status !== 'active') {
      throw new Error('Your account must be active to request inputs');
    }
    if (!farmer.cooperative_id) throw new Error('You must belong to a cooperative to request inputs');

    const input = await AgriculturalInput.findByPk(data.input_id);
    if (!input || !input.is_active) throw new Error('Input not found or inactive');

    const available = parseFloat(input.stock_quantity as any);
    if (available < data.quantity) {
      throw new Error(`Insufficient stock. Available: ${available} ${input.unit}`);
    }

    const existing = await InputRequest.findOne({
      where: { farmer_id: farmer.id, input_id: data.input_id, status: 'pending' },
    });
    if (existing) throw new Error('You already have a pending request for this input');

    const request = await InputRequest.create({
      farmer_id: farmer.id,
      cooperative_id: farmer.cooperative_id,
      input_id: data.input_id,
      quantity: data.quantity,
      reason: data.reason,
      season: data.season,
      status: 'pending',
    });

    const farmerName = (farmer as any).user?.full_name || 'A farmer';
    await notifyCoopLeader(
      farmer.cooperative_id,
      'New Input Request',
      `${farmerName} requested ${data.quantity} ${input.unit} of ${input.name}.`,
      'input_request',
      request.id,
      'input_request',
    );

    logger.info(`Input request created: ${request.id} by farmer ${farmer.id}`);
    return request;
  }

  static async list(query: any, userId: string, userRole: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;

    if (userRole === 'farmer') {
      const farmer = await Farmer.findOne({ where: { user_id: userId } });
      if (!farmer) return { data: [], pagination: buildPagination(page, limit, 0) };
      where.farmer_id = farmer.id;
    } else if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (!coop) return { data: [], pagination: buildPagination(page, limit, 0) };
      where.cooperative_id = coop.id;
    }

    const { count, rows } = await InputRequest.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: AgriculturalInput, as: 'input', attributes: ['name', 'unit', 'subsidized_price', 'unit_price'] },
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

  static async review(
    requestId: string,
    reviewerId: string,
    action: 'approve' | 'reject',
    feedback: string,
    quantity?: number,
  ) {
    if (!feedback?.trim()) throw new Error('Feedback is required');

    const coop = await Cooperative.findOne({ where: { manager_id: reviewerId } });
    if (!coop) throw new Error('No cooperative found for your account');

    const request = await InputRequest.findByPk(requestId, {
      include: [
        { model: AgriculturalInput, as: 'input' },
        {
          model: Farmer, as: 'farmer',
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
        },
      ],
    });
    if (!request) throw new Error('Input request not found');
    if (request.cooperative_id !== coop.id) throw new Error('This request does not belong to your cooperative');
    if (request.status !== 'pending') throw new Error('Only pending requests can be reviewed');

    if (action === 'reject') {
      await request.update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        rejection_reason: feedback,
      });

      const farmerUser = (request as any).farmer?.user as User | undefined;
      if (farmerUser) {
        await notifyUser(
          farmerUser.id,
          'Input Request Rejected',
          feedback,
          'input_request',
          request.id,
          'input_request',
        );
        const { sendDistributionEmail } = await import('../services/email.service');
        await sendDistributionEmail(
          farmerUser.email,
          farmerUser.full_name,
          'Input Request Rejected',
          'Your input request was rejected by your cooperative leader.',
          { Feedback: feedback },
        );
      }
      return request;
    }

    const input = (request as any).input as AgriculturalInput;
    const requestedQty = parseFloat(request.quantity as any);
    const allocQty = quantity ?? requestedQty;

    const dist = await InputService.createDistribution({
      farmer_id: request.farmer_id,
      input_id: request.input_id,
      cooperative_id: request.cooperative_id,
      quantity: allocQty,
      season: request.season,
      notes: request.reason,
    }, reviewerId, 'cooperative');

    await request.update({
      status: 'fulfilled',
      quantity: allocQty,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      distribution_id: dist.id,
    });

    const farmerUser = (request as any).farmer?.user as User | undefined;
    if (farmerUser) {
      const qtyNote = allocQty !== requestedQty
        ? ` Allocated ${allocQty} ${input.unit} (requested ${requestedQty}).`
        : ` Allocated ${allocQty} ${input.unit}.`;
      await notifyUser(
        farmerUser.id,
        'Input Request Approved',
        `${feedback}${qtyNote}`,
        'input_request',
        request.id,
        'input_request',
      );
    }

    logger.info(`Input request ${requestId} approved, distribution ${dist.id}`);
    return { request, distribution: dist };
  }

  static async getPendingCountForCoop(userId: string) {
    const coop = await Cooperative.findOne({ where: { manager_id: userId } });
    if (!coop) return 0;
    return InputRequest.count({ where: { cooperative_id: coop.id, status: 'pending' } });
  }
}
