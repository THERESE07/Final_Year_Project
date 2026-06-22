import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { Cooperative } from '../models/associations';

const REG_NUMBER_PATTERN = /^COOP-\d{4}-\d{4}$/;

export class CooperativeService {
  /** Format: COOP-YYYY-0001 (4-digit sequence per year) */
  static formatRegistrationNumber(year: number, sequence: number): string {
    return `COOP-${year}-${String(sequence).padStart(4, '0')}`;
  }

  static async generateRegistrationNumber(
    year?: number,
    transaction?: Transaction,
  ): Promise<string> {
    const regYear = year || new Date().getFullYear();
    const prefix = `COOP-${regYear}-`;

    const existing = await Cooperative.findAll({
      where: { registration_number: { [Op.like]: `${prefix}%` } },
      attributes: ['registration_number'],
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : undefined,
    });

    let maxSeq = 0;
    for (const coop of existing) {
      const num = coop.registration_number;
      if (!num) continue;
      const match = num.match(/^COOP-(\d{4})-(\d+)$/);
      if (match && parseInt(match[1], 10) === regYear) {
        maxSeq = Math.max(maxSeq, parseInt(match[2], 10));
      }
    }

    return this.formatRegistrationNumber(regYear, maxSeq + 1);
  }

  static async create(data: Record<string, unknown>, transaction?: Transaction) {
    const run = async (t: Transaction) => {
      const establishedYear = data.established_year
        ? parseInt(String(data.established_year), 10)
        : undefined;
      const year = establishedYear || new Date().getFullYear();

      const manual = typeof data.registration_number === 'string'
        ? data.registration_number.trim()
        : '';

      const registration_number = manual || await this.generateRegistrationNumber(year, t);

      return Cooperative.create({
        ...data,
        registration_number,
      } as any, { transaction: t });
    };

    if (transaction) return run(transaction);
    return sequelize.transaction(run);
  }

  static async update(id: string, data: Record<string, unknown>) {
    const coop = await Cooperative.findByPk(id);
    if (!coop) throw new Error('Cooperative not found');

    const updates = { ...data };
    if (!coop.registration_number && !updates.registration_number) {
      const year = (updates.established_year as number) || coop.established_year || new Date().getFullYear();
      updates.registration_number = await this.generateRegistrationNumber(year);
    }

    await coop.update(updates as any);
    return coop;
  }
}

export { REG_NUMBER_PATTERN };
