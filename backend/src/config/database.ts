import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'agrisubsidy_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true, freezeTableName: true },
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected via Sequelize');
  } catch (authErr: any) {
    console.error('❌ Cannot connect to PostgreSQL:', authErr.message);
    console.error('   Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env');
    throw authErr;
  }

  try {
    // Drop any old ENUM-based CHECK constraints that conflict with our STRING columns
    // This handles the case where the DB has old schema from a previous version
    await sequelize.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        -- Drop old check constraints on users table (from ENUM migration)
        FOR r IN (
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'users'
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%role%'
        ) LOOP
          EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
        END LOOP;

        -- Drop old check constraints on users status column
        FOR r IN (
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'users'
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%status%'
        ) LOOP
          EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
        END LOOP;
      END $$;
    `);
  } catch (dropErr: any) {
    // Non-fatal: table may not exist yet on first run
    console.log('ℹ️  Constraint cleanup skipped (first run or no conflicts)');
  }

  try {
    // Add columns introduced after initial schema (safe to re-run)
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_feedback TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_cooperative_id UUID;
      ALTER TABLE users ALTER COLUMN status TYPE VARCHAR(30);
      ALTER TABLE input_distributions ADD COLUMN IF NOT EXISTS allocation_id UUID;
    `);
  } catch (migrateErr: any) {
    // Non-fatal on first run before users table exists
    console.log('ℹ️  User column migration skipped:', migrateErr.message);
  }

  try {
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ All database tables synced successfully');
  } catch (syncErr: any) {
    console.error('❌ Sequelize sync failed:', syncErr.message);
    if (syncErr.original) console.error('   SQL:', syncErr.original.message);
    console.error('\n💡 Try: DROP DATABASE agrisubsidy_db; CREATE DATABASE agrisubsidy_db;');
    throw syncErr;
  }
};

export default sequelize;
