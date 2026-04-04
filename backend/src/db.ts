import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://appuser:apppassword@localhost:5432/appdb',
});

export default pool;
