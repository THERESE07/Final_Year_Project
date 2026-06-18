import 'dotenv/config';
import sequelize from '../src/config/database';

const SQL = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_feedback TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_cooperative_id UUID;
  ALTER TABLE users ALTER COLUMN status TYPE VARCHAR(30);
`;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query(SQL);
    console.log('User approval columns migrated successfully');
    process.exit(0);
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
