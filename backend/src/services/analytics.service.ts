import { QueryTypes, Op } from 'sequelize';
import sequelize from '../config/database';
import { User, Cooperative, Farmer, SubsidyApplication, InputDistribution, AgriculturalInput, SubsidyProgram, Notification, AuditLog } from '../models/associations';
import { buildPagination } from '../utils/response';

export class AnalyticsService {
  /** Public landing-page statistics (no auth required) */
  static async getPublicStats() {
    const [totalFarmers, totalCooperatives] = await Promise.all([
      User.count({ where: { role: 'farmer', status: 'active' } }),
      Cooperative.count({ where: { status: 'active' } }),
    ]);

    const [subsidyResult] = await sequelize.query(
      `SELECT COALESCE(SUM(disbursed_amount),0) as total FROM subsidy_applications WHERE status IN ('approved','disbursed')`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const [distResult] = await sequelize.query(
      `SELECT COALESCE(SUM(quantity),0) as total_tons FROM input_distributions WHERE status='distributed'`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const [farmerGrowth] = await sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month,
         COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
           AND created_at < DATE_TRUNC('month', NOW())) as last_month
       FROM users WHERE role='farmer' AND status='active'`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const [coopGrowth] = await sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month,
         COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
           AND created_at < DATE_TRUNC('month', NOW())) as last_month
       FROM cooperatives WHERE status='active'`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const [distGrowth] = await sequelize.query(
      `SELECT
         COALESCE(SUM(quantity) FILTER (WHERE distribution_date >= DATE_TRUNC('month', NOW())),0) as this_month,
         COALESCE(SUM(quantity) FILTER (WHERE distribution_date >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
           AND distribution_date < DATE_TRUNC('month', NOW())),0) as last_month
       FROM input_distributions WHERE status='distributed'`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const [subsidyGrowth] = await sequelize.query(
      `SELECT
         COALESCE(SUM(disbursed_amount) FILTER (WHERE reviewed_at >= DATE_TRUNC('month', NOW())),0) as this_month,
         COALESCE(SUM(disbursed_amount) FILTER (WHERE reviewed_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
           AND reviewed_at < DATE_TRUNC('month', NOW())),0) as last_month
       FROM subsidy_applications WHERE status IN ('approved','disbursed')`,
      { type: QueryTypes.SELECT },
    ) as any[];

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : curr > 0 ? 100 : 0;

    const farmersThis = parseInt(farmerGrowth?.this_month || '0', 10);
    const farmersLast = parseInt(farmerGrowth?.last_month || '0', 10);
    const coopsThis = parseInt(coopGrowth?.this_month || '0', 10);
    const coopsLast = parseInt(coopGrowth?.last_month || '0', 10);
    const distThis = parseFloat(distGrowth?.this_month || '0');
    const distLast = parseFloat(distGrowth?.last_month || '0');
    const subThis = parseFloat(subsidyGrowth?.this_month || '0');
    const subLast = parseFloat(subsidyGrowth?.last_month || '0');

    const totalSubsidies = parseFloat(subsidyResult?.total || '0');
    const totalTons = parseFloat(distResult?.total_tons || '0');

    return {
      total_farmers: totalFarmers,
      total_cooperatives: totalCooperatives,
      total_distributed_tons: totalTons,
      total_subsidies_rwf: totalSubsidies,
      growth: {
        farmers_pct: pct(farmersThis, farmersLast),
        cooperatives_pct: pct(coopsThis, coopsLast),
        distributed_pct: pct(distThis, distLast),
        subsidies_pct: pct(subThis, subLast),
      },
    };
  }

  static async getAdminDashboard() {
    const [totalFarmers, totalCooperatives, totalActiveInputs, pendingUsers, pendingApplications] = await Promise.all([
      User.count({ where: { role: 'farmer', status: 'active' } }),
      Cooperative.count({ where: { status: 'active' } }),
      AgriculturalInput.count({ where: { is_active: true } }),
      User.count({ where: { status: 'pending' } }),
      SubsidyApplication.count({ where: { status: 'pending' } }),
    ]);

    const [subsidyResult] = await sequelize.query(`SELECT COALESCE(SUM(disbursed_amount),0) as total FROM subsidy_applications WHERE status IN ('approved','disbursed')`, { type: QueryTypes.SELECT }) as any[];
    const [distResult] = await sequelize.query(`SELECT COALESCE(SUM(quantity),0) as total_tons, COALESCE(SUM(total_amount),0) as total_value FROM input_distributions WHERE status='distributed'`, { type: QueryTypes.SELECT }) as any[];

    const recentActivities = await sequelize.query(`
      SELECT u.full_name as actor, 'Registered as ' || u.role as action, u.created_at as timestamp, COALESCE(c.name,'') as cooperative
      FROM users u LEFT JOIN farmers f ON f.user_id=u.id LEFT JOIN cooperatives c ON c.id=f.cooperative_id
      ORDER BY u.created_at DESC LIMIT 8`, { type: QueryTypes.SELECT });

    const monthlyDistribution = await sequelize.query(`
      SELECT TO_CHAR(DATE_TRUNC('month',distribution_date::date),'Mon YYYY') as month,
             SUM(quantity) as total_quantity, SUM(total_amount) as total_value, COUNT(*) as count
      FROM input_distributions WHERE status='distributed' AND distribution_date >= NOW()-INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month',distribution_date::date) ORDER BY DATE_TRUNC('month',distribution_date::date)`, { type: QueryTypes.SELECT });

    const monthlySubsidies = await sequelize.query(`
      SELECT TO_CHAR(DATE_TRUNC('month',reviewed_at),'Mon YYYY') as month,
             SUM(approved_amount) as allocated, SUM(disbursed_amount) as disbursed
      FROM subsidy_applications WHERE status IN ('approved','disbursed') AND reviewed_at >= NOW()-INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month',reviewed_at) ORDER BY DATE_TRUNC('month',reviewed_at)`, { type: QueryTypes.SELECT });

    const farmersByProvince = await sequelize.query(`
      SELECT province, COUNT(*) as count FROM farmers WHERE province IS NOT NULL GROUP BY province ORDER BY count DESC`, { type: QueryTypes.SELECT });

    const inputsByCategory = await sequelize.query(`
      SELECT ic.name as category, SUM(id2.quantity) as total_kg
      FROM input_distributions id2
      JOIN agricultural_inputs ai ON ai.id=id2.input_id
      JOIN input_categories ic ON ic.id=ai.category_id
      WHERE id2.status='distributed' GROUP BY ic.name ORDER BY total_kg DESC`, { type: QueryTypes.SELECT });

    const lowStock = await sequelize.query(`
      SELECT name, stock_quantity, minimum_stock, unit, supplier FROM agricultural_inputs
      WHERE is_active=true AND stock_quantity <= minimum_stock ORDER BY (stock_quantity/NULLIF(minimum_stock,0)) ASC LIMIT 5`, { type: QueryTypes.SELECT });

    return {
      stats: {
        total_farmers: totalFarmers, total_cooperatives: totalCooperatives,
        total_active_inputs: totalActiveInputs, pending_users: pendingUsers,
        pending_applications: pendingApplications,
        total_subsidies_rwf: parseFloat(subsidyResult?.total || '0'),
        total_distributed_tons: parseFloat(distResult?.total_tons || '0'),
        total_distributed_value: parseFloat(distResult?.total_value || '0'),
      },
      recent_activities: recentActivities,
      monthly_distribution: monthlyDistribution,
      monthly_subsidies: monthlySubsidies,
      farmers_by_province: farmersByProvince,
      inputs_by_category: inputsByCategory,
      low_stock_items: lowStock,
    };
  }

  static async getFarmerDashboard(userId: string) {
    const farmer = await Farmer.findOne({ where: { user_id: userId } });
    if (!farmer) return { stats: {}, distributions: [], applications: [], notifications: [] };

    const [distributions, applications, notifications] = await Promise.all([
      sequelize.query(`SELECT d.*, ai.name as input_name, ai.unit, ai.supplier FROM input_distributions d JOIN agricultural_inputs ai ON ai.id=d.input_id WHERE d.farmer_id=:fid ORDER BY d.created_at DESC LIMIT 20`, { replacements: { fid: farmer.id }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT sa.*, sp.name as program_name, sp.type as program_type FROM subsidy_applications sa JOIN subsidy_programs sp ON sp.id=sa.program_id WHERE sa.farmer_id=:fid ORDER BY sa.created_at DESC`, { replacements: { fid: farmer.id }, type: QueryTypes.SELECT }),
      Notification.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], limit: 10 }),
    ]);

    const [stats] = await sequelize.query(`
      SELECT COUNT(DISTINCT d.id) as total_inputs,
             COUNT(DISTINCT CASE WHEN d.status='distributed' THEN d.id END) as received_inputs,
             COUNT(DISTINCT CASE WHEN d.status='pending' THEN d.id END) as pending_inputs,
             COALESCE(SUM(CASE WHEN sa.status IN ('approved','disbursed') THEN sa.approved_amount END),0) as total_subsidy_amount,
             COUNT(DISTINCT sa.id) as total_applications,
             COUNT(DISTINCT CASE WHEN sa.status='disbursed' THEN sa.id END) as disbursed_applications
      FROM farmers f
      LEFT JOIN input_distributions d ON d.farmer_id=f.id
      LEFT JOIN subsidy_applications sa ON sa.farmer_id=f.id
      WHERE f.id=:fid`, { replacements: { fid: farmer.id }, type: QueryTypes.SELECT }) as any[];

    return { stats: stats || {}, distributions, applications, notifications };
  }

  static async getCooperativeDashboard(userId: string) {
    const coop = await Cooperative.findOne({ where: { manager_id: userId } });
    if (!coop) return null;

    const [stats, farmers, pendingDists, stock] = await Promise.all([
      sequelize.query(`
        SELECT COUNT(DISTINCT f.id) as total_farmers,
               COALESCE(SUM(CASE WHEN d.status='distributed' THEN d.quantity END),0) as total_distributed_kg,
               COUNT(DISTINCT CASE WHEN d.status='pending' THEN d.id END) as pending_distributions,
               COALESCE(SUM(CASE WHEN d.status='distributed' THEN d.total_amount END),0) as total_distributed_value
        FROM cooperatives c
        LEFT JOIN farmers f ON f.cooperative_id=c.id
        LEFT JOIN input_distributions d ON d.cooperative_id=c.id
        WHERE c.id=:cid`, { replacements: { cid: coop.id }, type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT f.id as farmer_id, u.id as user_id, u.full_name, u.phone, u.email, u.status,
               f.farm_size_hectares, f.crop_types, f.district, f.farmer_code,
               (SELECT COUNT(*) FROM input_distributions d
                WHERE d.farmer_id = f.id AND d.status = 'distributed') as input_count,
               (SELECT COALESCE(SUM(CASE
                  WHEN sa.status = 'disbursed' THEN sa.disbursed_amount
                  WHEN sa.status = 'approved' THEN sa.approved_amount
                  ELSE 0
                END), 0) FROM subsidy_applications sa WHERE sa.farmer_id = f.id) as subsidy_amount
        FROM farmers f JOIN users u ON u.id=f.user_id
        WHERE f.cooperative_id=:cid ORDER BY u.full_name`, { replacements: { cid: coop.id }, type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT d.*,ai.name as input_name,ai.unit,u.full_name as farmer_name,u.phone as farmer_phone
        FROM input_distributions d JOIN agricultural_inputs ai ON ai.id=d.input_id
        JOIN farmers f ON f.id=d.farmer_id JOIN users u ON u.id=f.user_id
        WHERE d.cooperative_id=:cid AND d.status='pending' ORDER BY d.created_at DESC LIMIT 10`, { replacements: { cid: coop.id }, type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT cia.input_id, ai.name, ai.unit, ic.name as category_name,
               cia.allocated_quantity, cia.distributed_quantity,
               (cia.allocated_quantity - cia.distributed_quantity) as remaining_quantity,
               cia.allocation_date, cia.status
        FROM cooperative_input_allocations cia
        JOIN agricultural_inputs ai ON ai.id = cia.input_id
        LEFT JOIN input_categories ic ON ic.id = ai.category_id
        WHERE cia.cooperative_id = :cid AND cia.status IN ('active','depleted')
        ORDER BY cia.allocation_date DESC`, { replacements: { cid: coop.id }, type: QueryTypes.SELECT }),
    ]);

    return { cooperative: coop, stats: (stats as any[])[0] || {}, farmers, pending_requests: pendingDists, stock };
  }

  static async getSubsidyAnalytics() {
    const [programStats, monthlyData, topCoops, statusBreakdown] = await Promise.all([
      sequelize.query(`
        SELECT sp.id,sp.name,sp.type,sp.total_budget,sp.allocated_budget,sp.disbursed_budget,sp.status,sp.season,
               COUNT(sa.id) as application_count,
               COUNT(CASE WHEN sa.status='approved' THEN 1 END) as approved_count,
               COUNT(CASE WHEN sa.status='disbursed' THEN 1 END) as disbursed_count,
               COUNT(CASE WHEN sa.status='pending' THEN 1 END) as pending_count
        FROM subsidy_programs sp LEFT JOIN subsidy_applications sa ON sa.program_id=sp.id
        GROUP BY sp.id ORDER BY sp.created_at DESC`, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT TO_CHAR(DATE_TRUNC('month',reviewed_at),'Mon YYYY') as month,
               SUM(approved_amount) as total_allocated, SUM(disbursed_amount) as total_disbursed, COUNT(*) as applications
        FROM subsidy_applications WHERE status IN ('approved','disbursed') AND reviewed_at >= NOW()-INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month',reviewed_at) ORDER BY DATE_TRUNC('month',reviewed_at)`, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT c.name,COUNT(sa.id) as applications,COALESCE(SUM(sa.approved_amount),0) as total_allocated,COALESCE(SUM(sa.disbursed_amount),0) as total_disbursed
        FROM cooperatives c JOIN farmers f ON f.cooperative_id=c.id JOIN subsidy_applications sa ON sa.farmer_id=f.id
        WHERE sa.status IN ('approved','disbursed') GROUP BY c.id ORDER BY total_allocated DESC LIMIT 5`, { type: QueryTypes.SELECT }),

      sequelize.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(requested_amount),0) as total_amount FROM subsidy_applications GROUP BY status`, { type: QueryTypes.SELECT }),
    ]);

    return { program_stats: programStats, monthly_data: monthlyData, top_cooperatives: topCoops, status_breakdown: statusBreakdown };
  }

  static async getInventoryStats() {
    const [items, movements, supplierStats] = await Promise.all([
      sequelize.query(`
        SELECT ai.*,ic.name as category_name,
               COALESCE(SUM(CASE WHEN d.status='distributed' THEN d.quantity END),0) as total_distributed,
               COUNT(CASE WHEN d.status='pending' THEN 1 END) as pending_distributions
        FROM agricultural_inputs ai LEFT JOIN input_categories ic ON ic.id=ai.category_id
        LEFT JOIN input_distributions d ON d.input_id=ai.id
        WHERE ai.is_active=true GROUP BY ai.id,ic.name ORDER BY ai.name`, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT d.id,d.status,d.quantity,d.distribution_date,d.created_at,
               ai.name as input_name,ai.unit,
               u.full_name as farmer_name,c.name as cooperative_name
        FROM input_distributions d JOIN agricultural_inputs ai ON ai.id=d.input_id
        JOIN farmers f ON f.id=d.farmer_id JOIN users u ON u.id=f.user_id
        LEFT JOIN cooperatives c ON c.id=d.cooperative_id
        ORDER BY d.created_at DESC LIMIT 10`, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT supplier, COUNT(*) as total_inputs,
               SUM(stock_quantity) as total_stock, COUNT(CASE WHEN stock_quantity<=minimum_stock THEN 1 END) as low_stock_count
        FROM agricultural_inputs WHERE is_active=true AND supplier IS NOT NULL
        GROUP BY supplier ORDER BY total_inputs DESC`, { type: QueryTypes.SELECT }),
    ]);

    return { items, recent_movements: movements, supplier_stats: supplierStats };
  }

  static async getAuditLogs(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    const logs = await sequelize.query(`
      SELECT al.*,u.full_name as user_name FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id
      ORDER BY al.created_at DESC LIMIT :limit OFFSET :offset`,
      { replacements: { limit, offset }, type: QueryTypes.SELECT });
    return logs;
  }

  /** Paginated beneficiary list with received inputs & subsidy totals */
  static async getBeneficiaries(query: any, userId: string, userRole: string) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 5000);
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let coopFilter = '';
    const replacements: Record<string, unknown> = { limit, offset };

    if (userRole === 'cooperative') {
      const coop = await Cooperative.findOne({ where: { manager_id: userId } });
      if (!coop) return { data: [], pagination: buildPagination(page, limit, 0) };
      coopFilter = 'AND f.cooperative_id = :coopId';
      replacements.coopId = coop.id;
    }

    let searchFilter = '';
    if (search) {
      searchFilter = `AND (
        u.full_name ILIKE :search OR u.phone ILIKE :search OR u.email ILIKE :search
        OR f.farmer_code ILIKE :search OR c.name ILIKE :search
      )`;
      replacements.search = `%${search}%`;
    }

    const baseFrom = `
      FROM farmers f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN cooperatives c ON c.id = f.cooperative_id
      WHERE u.role = 'farmer' ${coopFilter} ${searchFilter}`;

    const [countRow] = await sequelize.query(
      `SELECT COUNT(DISTINCT f.id) as total ${baseFrom}`,
      { replacements, type: QueryTypes.SELECT },
    ) as any[];

    const total = parseInt(countRow?.total || '0', 10);

    const rows = await sequelize.query(`
      SELECT f.id as farmer_id, u.id as user_id, u.full_name, u.phone, u.email, u.status,
             f.farmer_code, f.district, f.province,
             c.name as cooperative_name,
             (SELECT COUNT(*) FROM input_distributions d
              WHERE d.farmer_id = f.id AND d.status = 'distributed') as input_count,
             (SELECT COALESCE(SUM(CASE
                WHEN sa.status = 'disbursed' THEN sa.disbursed_amount
                WHEN sa.status = 'approved' THEN sa.approved_amount
                ELSE 0
              END), 0) FROM subsidy_applications sa WHERE sa.farmer_id = f.id) as subsidy_amount
      ${baseFrom}
      ORDER BY u.full_name
      LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT },
    );

    return { data: rows, pagination: buildPagination(page, limit, total) };
  }
}
