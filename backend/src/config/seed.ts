import 'dotenv/config';
import fs from 'fs';
if (!fs.existsSync('logs')) fs.mkdirSync('logs', { recursive: true });

import { connectDB } from './database';
import { setupAssociations } from '../models/associations';
import {
  User, Cooperative, Farmer, InputCategory,
  AgriculturalInput, SubsidyProgram, SubsidyApplication,
  InputDistribution, Notification
} from '../models/associations';
import { Op } from 'sequelize';

// Safe create: skip if ANY unique field already exists
async function safeCreate(model: any, uniqueWhere: object, data: object): Promise<any> {
  const existing = await model.findOne({ where: uniqueWhere });
  if (existing) {
    console.log(`  ↩ Already exists, skipping`);
    return existing;
  }
  return model.create(data);
}

const seed = async () => {
  console.log('Setting up associations...');
  setupAssociations();
  console.log('Connecting to database...');
  await connectDB();
  console.log('\n🌱 Seeding database...\n');

  // ===== USERS =====
  // Search by BOTH email AND national_id to avoid unique constraint on either
  console.log('Creating admin user...');
  const admin = await safeCreate(
    User,
    { [Op.or]: [{ email: 'admin@agrifop.rw' }, { national_id: '1199000000000001' }] },
    { full_name: 'System Administrator', national_id: '1199000000000001', email: 'admin@agrifop.rw', phone: '+250788000001', password_hash: 'Admin@123', role: 'admin', status: 'active', is_verified: true }
  );
  console.log('✅ Admin:', admin.email);

  console.log('Creating cooperative leader...');
  const coopUser = await safeCreate(
    User,
    { [Op.or]: [{ email: 'eric.habimana@agrifop.rw' }, { national_id: '1198560089012345' }] },
    { full_name: 'Eric Habimana', national_id: '1198560089012345', email: 'eric.habimana@agrifop.rw', phone: '+250788456789', password_hash: 'Coop@123', role: 'cooperative', status: 'active', is_verified: true }
  );
  console.log('✅ Cooperative user:', coopUser.email);

  console.log('Creating farmer 1...');
  const farmerUser = await safeCreate(
    User,
    { [Op.or]: [{ email: 'jean.uwimana@agrifop.rw' }, { national_id: '1199080012345678' }] },
    { full_name: 'Jean Paul Uwimana', national_id: '1199080012345678', email: 'jean.uwimana@agrifop.rw', phone: '+250788123456', password_hash: 'Farmer@123', role: 'farmer', status: 'active', is_verified: true }
  );
  console.log('✅ Farmer 1:', farmerUser.email);

  console.log('Creating farmer 2...');
  const farmerUser2 = await safeCreate(
    User,
    { [Op.or]: [{ email: 'marie.mukamana@agrifop.rw' }, { national_id: '1198570023456789' }] },
    { full_name: 'Marie Claire Mukamana', national_id: '1198570023456789', email: 'marie.mukamana@agrifop.rw', phone: '+250788234567', password_hash: 'Farmer@123', role: 'farmer', status: 'active', is_verified: true }
  );
  console.log('✅ Farmer 2:', farmerUser2.email);

  console.log('Creating farmer 3...');
  const farmerUser3 = await safeCreate(
    User,
    { [Op.or]: [{ email: 'patrick.niyonzima@agrifop.rw' }, { national_id: '1197560034567890' }] },
    { full_name: 'Patrick Niyonzima', national_id: '1197560034567890', email: 'patrick.niyonzima@agrifop.rw', phone: '+250788345678', password_hash: 'Farmer@123', role: 'farmer', status: 'active', is_verified: true }
  );
  console.log('✅ Farmer 3:', farmerUser3.email);

  console.log('Creating pending user...');
  await safeCreate(
    User,
    { [Op.or]: [{ email: 'alice.uwase@agrifop.rw' }, { national_id: '1199670078901234' }] },
    { full_name: 'Alice Uwase', national_id: '1199670078901234', email: 'alice.uwase@agrifop.rw', phone: '+250788789012', password_hash: 'Farmer@123', role: 'farmer', status: 'pending', is_verified: false }
  );
  console.log('✅ Pending user created');

  // ===== COOPERATIVES =====
  console.log('\nCreating cooperatives...');
  const coop = await safeCreate(Cooperative, { name: 'Abiyuje Cooperative' }, {
    name: 'Abiyuje Cooperative', registration_number: 'COOP-2018-001',
    province: 'Northern', district: 'Musanze', sector: 'Musanze',
    contact_person: 'Eric Habimana', contact_phone: '+250788456789',
    contact_email: 'eric.habimana@agrifop.rw',
    description: 'Agricultural cooperative in Musanze specializing in maize and beans',
    established_year: 2018, status: 'active', manager_id: coopUser.id,
  });
  console.log('✅ Cooperative 1:', coop.name);

  const coop2 = await safeCreate(Cooperative, { name: 'Duterimbere Cooperative' }, {
    name: 'Duterimbere Cooperative', registration_number: 'COOP-2020-002',
    province: 'Eastern', district: 'Kayonza', sector: 'Kayonza',
    description: 'Eastern province agricultural cooperative',
    established_year: 2020, status: 'active',
  });
  console.log('✅ Cooperative 2:', coop2.name);

  // ===== FARMER PROFILES =====
  console.log('\nCreating farmer profiles...');
  const ts = Date.now().toString().slice(-6);
  const farmer1 = await safeCreate(Farmer, { user_id: farmerUser.id }, {
    user_id: farmerUser.id, cooperative_id: coop.id, farmer_code: `FRM${ts}1`,
    farm_size_hectares: 2.5, land_ownership: 'Owned', years_of_experience: 5,
    crop_types: ['Maize', 'Beans', 'Potatoes'],
    province: 'Northern', district: 'Musanze', sector: 'Musanze',
    mobile_money: '+250788123456',
  });
  console.log('✅ Farmer profile 1:', farmer1.farmer_code);

  const farmer2 = await safeCreate(Farmer, { user_id: farmerUser2.id }, {
    user_id: farmerUser2.id, cooperative_id: coop.id, farmer_code: `FRM${ts}2`,
    farm_size_hectares: 1.8, land_ownership: 'Leased', years_of_experience: 3,
    crop_types: ['Rice', 'Vegetables'],
    province: 'Northern', district: 'Musanze', sector: 'Kinigi',
    mobile_money: '+250788234567',
  });
  console.log('✅ Farmer profile 2:', farmer2.farmer_code);

  const farmer3 = await safeCreate(Farmer, { user_id: farmerUser3.id }, {
    user_id: farmerUser3.id, cooperative_id: coop2.id, farmer_code: `FRM${ts}3`,
    farm_size_hectares: 3.2, land_ownership: 'Owned', years_of_experience: 7,
    crop_types: ['Maize', 'Wheat', 'Beans'],
    province: 'Eastern', district: 'Kayonza', sector: 'Kayonza',
    mobile_money: '+250788345678',
  });
  console.log('✅ Farmer profile 3:', farmer3.farmer_code);

  // ===== INPUT CATEGORIES =====
  console.log('\nCreating input categories...');
  const fertCat = await safeCreate(InputCategory, { name: 'Fertilizers' }, { name: 'Fertilizers', description: 'Chemical and organic fertilizers', unit: 'kg' });
  const seedCat = await safeCreate(InputCategory, { name: 'Seeds' }, { name: 'Seeds', description: 'Improved and hybrid seeds', unit: 'kg' });
  await safeCreate(InputCategory, { name: 'Pesticides' }, { name: 'Pesticides', description: 'Herbicides and insecticides', unit: 'liter' });
  await safeCreate(InputCategory, { name: 'Tools' }, { name: 'Tools', description: 'Farm tools and equipment', unit: 'piece' });
  console.log('✅ Input categories ready');

  // ===== AGRICULTURAL INPUTS =====
  console.log('\nCreating agricultural inputs...');
  const npk = await safeCreate(AgriculturalInput, { name: 'NPK Fertilizer 17-17-17' }, {
    name: 'NPK Fertilizer 17-17-17', category_id: fertCat.id,
    description: 'Balanced NPK fertilizer for all crops',
    unit: 'kg', unit_price: 1200, subsidized_price: 800,
    stock_quantity: 2500, minimum_stock: 200,
    supplier: 'Rwanda Fertilizer Ltd', season: 'Season B',
    batch_number: 'NPK-2025-001', is_active: true, created_by: admin.id,
  });
  const dap = await safeCreate(AgriculturalInput, { name: 'DAP Fertilizer' }, {
    name: 'DAP Fertilizer', category_id: fertCat.id,
    description: 'Diammonium Phosphate for root development',
    unit: 'kg', unit_price: 1500, subsidized_price: 1000,
    stock_quantity: 1800, minimum_stock: 150,
    supplier: 'Rwanda Fertilizer Ltd', season: 'Season B', is_active: true, created_by: admin.id,
  });
  const maize = await safeCreate(AgriculturalInput, { name: 'Hybrid Maize Seeds ZM607' }, {
    name: 'Hybrid Maize Seeds ZM607', category_id: seedCat.id,
    description: 'High-yielding hybrid maize variety',
    unit: 'kg', unit_price: 8000, subsidized_price: 5500,
    stock_quantity: 450, minimum_stock: 50,
    supplier: 'East Africa Seeds', season: 'Season B', is_active: true, created_by: admin.id,
  });
  await safeCreate(AgriculturalInput, { name: 'Bean Seeds RWR2245' }, {
    name: 'Bean Seeds RWR2245', category_id: seedCat.id,
    unit: 'kg', unit_price: 4500, subsidized_price: 3000,
    stock_quantity: 680, minimum_stock: 50,
    supplier: 'AgriPro Rwanda', season: 'Season B', is_active: true, created_by: admin.id,
  });
  await safeCreate(AgriculturalInput, { name: 'Urea Fertilizer' }, {
    name: 'Urea Fertilizer', category_id: fertCat.id,
    unit: 'kg', unit_price: 1000, subsidized_price: 650,
    stock_quantity: 95, minimum_stock: 200,
    supplier: 'Rwanda Fertilizer Ltd', season: 'Season B', is_active: true, created_by: admin.id,
  });
  console.log('✅ Agricultural inputs ready');

  // ===== SUBSIDY PROGRAMS =====
  console.log('\nCreating subsidy programs...');
  const program = await safeCreate(SubsidyProgram, { name: 'Season B Input Subsidy 2025' }, {
    name: 'Season B Input Subsidy 2025',
    description: 'Agricultural input subsidy for Season B 2025 supporting smallholder farmers',
    type: 'input', total_budget: 50000000, allocated_budget: 125000, disbursed_budget: 50000,
    season: 'Season B', start_date: '2025-09-01', end_date: '2026-03-31',
    max_amount_per_farmer: 150000, status: 'active', created_by: admin.id,
  });
  const program2 = await safeCreate(SubsidyProgram, { name: 'Seasonal Cash Support 2025' }, {
    name: 'Seasonal Cash Support 2025',
    description: 'Direct cash support for eligible smallholder farmers',
    type: 'cash', total_budget: 30000000, allocated_budget: 75000, disbursed_budget: 75000,
    season: 'Season B', start_date: '2025-09-01', end_date: '2026-03-31',
    max_amount_per_farmer: 75000, status: 'active', created_by: admin.id,
  });
  console.log('✅ Subsidy programs ready');

  // ===== SUBSIDY APPLICATIONS =====
  console.log('\nCreating subsidy applications...');
  const app1 = await safeCreate(
    SubsidyApplication,
    { program_id: program.id, farmer_id: farmer1.id },
    {
      program_id: program.id, farmer_id: farmer1.id, cooperative_id: coop.id,
      requested_amount: 50000, approved_amount: 50000, disbursed_amount: 50000,
      status: 'disbursed', application_reason: 'Purchase fertilizers for Season B crops',
      reviewed_by: admin.id, reviewed_at: new Date(),
      disbursement_method: 'Mobile Money', disbursement_reference: 'MTN-2025-001', disbursement_date: new Date(),
    }
  );
  const app2 = await safeCreate(
    SubsidyApplication,
    { program_id: program.id, farmer_id: farmer2.id },
    {
      program_id: program.id, farmer_id: farmer2.id, cooperative_id: coop.id,
      requested_amount: 75000, approved_amount: 75000, disbursed_amount: 0,
      status: 'approved', application_reason: 'Buy improved seeds and fertilizers',
      reviewed_by: admin.id, reviewed_at: new Date(),
    }
  );
  const app3 = await safeCreate(
    SubsidyApplication,
    { program_id: program2.id, farmer_id: farmer3.id },
    {
      program_id: program2.id, farmer_id: farmer3.id, cooperative_id: coop2.id,
      requested_amount: 60000, disbursed_amount: 0,
      status: 'pending', application_reason: 'Seasonal cash support for farm operations',
    }
  );
  console.log('✅ Subsidy applications ready');

  // ===== INPUT DISTRIBUTIONS =====
  console.log('\nCreating input distributions...');
  const today = new Date().toISOString().split('T')[0];
  await safeCreate(InputDistribution, { farmer_id: farmer1.id, input_id: npk.id }, {
    farmer_id: farmer1.id, cooperative_id: coop.id, input_id: npk.id,
    quantity: 50, unit_price: 800, total_amount: 40000,
    distribution_date: today, season: 'Season B', status: 'distributed',
    qr_code: 'DIST-ABC12345', distributed_by: admin.id,
  });
  await safeCreate(InputDistribution, { farmer_id: farmer1.id, input_id: maize.id }, {
    farmer_id: farmer1.id, cooperative_id: coop.id, input_id: maize.id,
    quantity: 10, unit_price: 5500, total_amount: 55000,
    distribution_date: today, season: 'Season B', status: 'distributed',
    qr_code: 'DIST-DEF67890', distributed_by: admin.id,
  });
  await safeCreate(InputDistribution, { farmer_id: farmer2.id, input_id: dap.id }, {
    farmer_id: farmer2.id, cooperative_id: coop.id, input_id: dap.id,
    quantity: 25, unit_price: 1000, total_amount: 25000,
    distribution_date: today, season: 'Season B', status: 'pending',
    qr_code: 'DIST-GHI11111',
  });
  await (npk as any).update({ stock_quantity: 2440 });
  await (maize as any).update({ stock_quantity: 440 });
  console.log('✅ Input distributions ready');

  // ===== NOTIFICATIONS =====
  console.log('\nCreating notifications...');
  const notifs = [
    { user_id: farmerUser.id, title: 'Welcome to AgriSubsidy', message: 'Your account is active. Apply for subsidies and track your inputs.', type: 'success', is_read: true },
    { user_id: farmerUser.id, title: 'Subsidy Disbursed', message: 'RWF 50,000 has been disbursed to your account via Mobile Money.', type: 'subsidy', is_read: false, related_id: app1.id, related_type: 'subsidy_application' },
    { user_id: farmerUser.id, title: 'Input Distributed', message: '50kg NPK Fertilizer and 10kg Maize Seeds have been distributed to you.', type: 'input', is_read: false },
    { user_id: farmerUser2.id, title: 'Subsidy Approved', message: 'Your Season B application for RWF 75,000 has been approved. Disbursement coming soon.', type: 'subsidy', is_read: false, related_id: app2.id, related_type: 'subsidy_application' },
    { user_id: farmerUser2.id, title: 'Input Pending', message: '25kg DAP Fertilizer distribution is pending approval at your cooperative.', type: 'input', is_read: true },
    { user_id: admin.id, title: 'New Pending Application', message: 'Patrick Niyonzima submitted a subsidy application for Seasonal Cash Support 2025.', type: 'info', is_read: false, related_id: app3.id, related_type: 'subsidy_application' },
    { user_id: admin.id, title: '⚠ Low Stock Alert', message: 'Urea Fertilizer stock (95 kg) is below minimum level (200 kg). Reorder needed.', type: 'warning', is_read: false },
    { user_id: admin.id, title: 'New User Registration', message: 'Alice Uwase has registered and is awaiting approval.', type: 'info', is_read: false },
    { user_id: coopUser.id, title: 'Distribution Request', message: 'New input distribution request from Marie Claire Mukamana needs your approval.', type: 'input', is_read: false },
    { user_id: coopUser.id, title: 'New Member Registered', message: 'Patrick Niyonzima has joined Duterimbere Cooperative.', type: 'info', is_read: true },
  ];
  for (const n of notifs) {
    await Notification.create(n as any).catch(() => {});
  }
  console.log('✅ Notifications ready');

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       ✅  Database seeded successfully!                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  🔑 Login Credentials:                                   ║');
  console.log('║  Admin:  admin@agrifop.rw           / Admin@123          ║');
  console.log('║  Coop:   eric.habimana@agrifop.rw   / Coop@123           ║');
  console.log('║  Farmer: jean.uwimana@agrifop.rw    / Farmer@123         ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  🌐 Frontend: http://localhost:3000                      ║');
  console.log('║  🚀 Backend:  http://localhost:5000/health               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
};

seed()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error('\n❌ Seed failed!');
    console.error('Error:', err.message);
    if (err.original) console.error('SQL Error:', err.original.message);
    if (err.errors) err.errors.forEach((e: any) => console.error(' -', e.path, ':', e.message));
    console.error('\n💡 Run this SQL to reset, then try again:');
    console.error('   DROP DATABASE agrisubsidy_db; CREATE DATABASE agrisubsidy_db;');
    process.exit(1);
  });
