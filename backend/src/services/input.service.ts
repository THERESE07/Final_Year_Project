import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AgriculturalInput, InputCategory, InputDistribution, Farmer, User, Cooperative, Notification } from '../models/associations';
import { AllocationService } from './allocation.service';
import { sendDistributionEmail } from './email.service';
import { buildPagination } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export class InputService {
  static async getAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = { is_active: true };
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    if (query.category_id) where.category_id = query.category_id;
    if (query.season) where.season = query.season;

    const { count, rows } = await AgriculturalInput.findAndCountAll({
      where, limit, offset,
      include: [{ model: InputCategory, as: 'category', attributes: ['name', 'unit'] }],
      order: [['created_at', 'DESC']],
    });
    return { data: rows, pagination: buildPagination(page, limit, count) };
  }

  static async create(data: any, createdBy: string) {
    const input = await AgriculturalInput.create({ ...data, created_by: createdBy });
    return input;
  }

  static async update(id: string, data: any) {
    const input = await AgriculturalInput.findByPk(id);
    if (!input) throw new Error('Input not found');
    await input.update(data);
    return input;
  }

  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract') {
    const input = await AgriculturalInput.findByPk(id);
    if (!input) throw new Error('Input not found');
    const current = parseFloat(input.stock_quantity as any);
    if (operation === 'subtract' && current < quantity) {
      throw new Error(`Insufficient stock. Available: ${current} ${input.unit}`);
    }
    const newStock = operation === 'add' ? current + quantity : current - quantity;
    await input.update({ stock_quantity: newStock });
    return input;
  }

  static async getFarmersForDistribution(userId?: string, userRole?: string) {
    const where: any = {};

    if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (!coop) return [];
      where.cooperative_id = coop.id;
    }

    const farmers = await Farmer.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'phone', 'email', 'status'],
          where: { status: 'active' },
          required: true,
        },
        { model: Cooperative, as: 'cooperative', attributes: ['id', 'name'] },
      ],
      order: [[{ model: User, as: 'user' }, 'full_name', 'ASC']],
    });

    return farmers.map((f) => ({
      farmer_id: f.id,
      user_id: f.user_id,
      full_name: (f as any).user?.full_name,
      phone: (f as any).user?.phone,
      farmer_code: f.farmer_code,
      cooperative_id: f.cooperative_id,
      cooperative_name: (f as any).cooperative?.name,
    }));
  }

  static async createDistribution(data: any, createdBy: string, creatorRole?: string) {
    if (creatorRole === 'admin') {
      throw new Error('Admins allocate inputs to cooperatives via Distribution Requests. Use the admin allocation workflow.');
    }
    if (creatorRole !== 'cooperative') {
      throw new Error('Only cooperative leaders can distribute inputs to farmers');
    }

    logger.info(`Creating distribution: farmer_id=${data.farmer_id}, input_id=${data.input_id}, by=${createdBy}`);

    const farmer = await Farmer.findByPk(data.farmer_id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'status', 'full_name', 'email'] },
        { model: Cooperative, as: 'cooperative', attributes: ['id', 'name'] },
      ],
    });
    if (!farmer) throw new Error('Farmer not found');

    const farmerUser = (farmer as any).user as User | undefined;
    if (!farmerUser || farmerUser.status !== 'active') {
      throw new Error('Farmer account is not active');
    }

    const managerCoop = await Cooperative.findOne({ where: { manager_id: createdBy } });
    if (!managerCoop) throw new Error('No cooperative found for your account');
    if (farmer.cooperative_id !== managerCoop.id) {
      throw new Error('Farmer does not belong to your cooperative');
    }

    const input = await AgriculturalInput.findByPk(data.input_id);
    if (!input || !input.is_active) throw new Error('Input not found or inactive');

    const unitPrice = parseFloat(input.subsidized_price as any) || parseFloat(input.unit_price as any);
    const total = unitPrice * data.quantity;
    const qrCode = `DIST-${uuidv4().slice(0, 8).toUpperCase()}`;

    const dist = await sequelize.transaction(async (t) => {
      const allocation = await AllocationService.deductFromAllocation(
        managerCoop.id,
        data.input_id,
        data.quantity,
        t,
      );

      return InputDistribution.create({
        farmer_id: data.farmer_id,
        cooperative_id: managerCoop.id,
        input_id: data.input_id,
        quantity: data.quantity,
        unit_price: unitPrice,
        total_amount: total,
        distribution_date: data.distribution_date || new Date(),
        season: data.season,
        notes: data.notes,
        status: 'distributed',
        qr_code: qrCode,
        approved_by: createdBy,
        distributed_by: createdBy,
        allocation_id: allocation.id,
      }, { transaction: t });
    });

    const msg = `You have received ${data.quantity} ${input.unit} of ${input.name} from your cooperative.`;
    await Notification.create({
      user_id: farmerUser.id,
      title: 'Input Received',
      message: msg,
      type: 'input',
      related_id: dist.id,
      related_type: 'distribution',
    } as any);
    await sendDistributionEmail(
      farmerUser.email,
      farmerUser.full_name,
      'Input Distribution Completed',
      msg,
      { Input: input.name, Quantity: `${data.quantity} ${input.unit}`, Date: String(dist.distribution_date) },
    );

    return dist;
  }

  static async approveDistribution(id: string, approverId: string, approverRole?: string) {
    const dist = await InputDistribution.findByPk(id, {
      include: [
        { model: AgriculturalInput, as: 'input' },
        { model: Farmer, as: 'farmer', include: [{ model: User, as: 'user' }] },
      ],
    });
    if (!dist) throw new Error('Distribution not found');
    if (dist.status !== 'pending') throw new Error('Only pending distributions can be approved');

    if (approverRole === 'cooperative' && dist.cooperative_id) {
      const coop = await Cooperative.findOne({ where: { manager_id: approverId } });
      if (!coop || coop.id !== dist.cooperative_id) {
        throw new Error('You can only approve distributions for your cooperative');
      }
    }

    const input = (dist as any).input as AgriculturalInput;
    const qty = parseFloat(dist.quantity as any);

    await sequelize.transaction(async (t) => {
      if (dist.cooperative_id) {
        const allocation = await AllocationService.deductFromAllocation(
          dist.cooperative_id,
          dist.input_id,
          qty,
          t,
        );
        await dist.update({
          status: 'distributed',
          approved_by: approverId,
          distributed_by: approverId,
          allocation_id: allocation.id,
        }, { transaction: t });
      } else {
        const available = parseFloat(input.stock_quantity as any);
        if (available < qty) throw new Error(`Insufficient stock. Available: ${available}`);
        await dist.update({ status: 'approved', approved_by: approverId }, { transaction: t });
        await input.update({ stock_quantity: available - qty }, { transaction: t });
        await dist.update({ status: 'distributed', distributed_by: approverId }, { transaction: t });
      }
    });

    const farmer = (dist as any).farmer as Farmer;
    const user = (farmer as any)?.user as User;
    if (user) {
      const msg = `${qty} ${input.unit} of ${input.name} has been distributed to you.`;
      await Notification.create({
        user_id: user.id,
        title: 'Input Distribution Completed',
        message: msg,
        type: 'input',
        related_id: dist.id,
        related_type: 'distribution',
      } as any);
      await sendDistributionEmail(
        user.email,
        user.full_name,
        'Input Distribution Completed',
        msg,
        { Input: input.name, Quantity: `${qty} ${input.unit}` },
      );
    }

    return dist;
  }

  static async getDistributions(query: any, userId?: string, userRole?: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.season) where.season = query.season;

    if (userRole === 'farmer') {
      const farmer = await Farmer.findOne({ where: { user_id: userId } });
      if (farmer) where.farmer_id = farmer.id;
    }

    if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (coop) where.cooperative_id = coop.id;
      else where.cooperative_id = null;
    }

    const { count, rows } = await InputDistribution.findAndCountAll({
      where, limit, offset,
      include: [
        { model: AgriculturalInput, as: 'input', attributes: ['name', 'unit', 'supplier'] },
        {
          model: Farmer, as: 'farmer',
          include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }],
        },
        { model: Cooperative, as: 'cooperative', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return { data: rows, pagination: buildPagination(page, limit, count) };
  }

  static async getLowStockAlerts() {
    const inputs = await AgriculturalInput.findAll({
      where: { is_active: true },
    });
    return inputs.filter(i => parseFloat(i.stock_quantity as any) <= parseFloat(i.minimum_stock as any));
  }
}
