import dotenv from 'dotenv';

dotenv.config();

const useSqlite = process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL;

const module = useSqlite ? await import('./db-sqlite.js') : await import('./db-pg.js');

export const query = module.query;
export const pool = module.pool;
export default pool;
