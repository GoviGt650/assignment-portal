import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/assignment_portal.db');

let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      pdf_url TEXT,
      deadline TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      github_url TEXT,
      uploaded_file TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'submitted',
      remarks TEXT,
      UNIQUE (assignment_id, student_id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      purpose TEXT NOT NULL,
      user_id INTEGER,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email, purpose)`);
  migrateUsersTable(db);
  persist();
  return db;
}

function migrateUsersTable(database) {
  const columns = runSelect(database, 'PRAGMA table_info(users)', []);
  const names = columns.map((col) => col.name);
  if (!names.includes('email')) {
    database.run('ALTER TABLE users ADD COLUMN email TEXT');
  }
  if (!names.includes('email_verified')) {
    database.run('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
  }
  database.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL');
}

function persist() {
  if (!db) return;
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function toSqliteSql(text, params = []) {
  const expandedParams = [];
  let sql = text.replace(/\$(\d+)/g, (_, num) => {
    expandedParams.push(params[parseInt(num, 10) - 1]);
    return '?';
  });
  sql = sql
    .replace(/ILIKE/gi, 'LIKE')
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/::\w+/g, '');
  return { sql, params: expandedParams };
}

function runSelect(database, sql, params) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function query(text, params = []) {
  const database = await getDb();
  const start = Date.now();
  const { sql, params: sqliteParams } = toSqliteSql(text, params);

  if (/^\s*INSERT/i.test(text) && /RETURNING/i.test(text)) {
    const tableMatch = text.match(/INTO\s+(\w+)/i);
    const table = tableMatch?.[1];
    const insertSql = sql.replace(/RETURNING.*/i, '').trim();
    database.run(insertSql, sqliteParams);
    const idRow = runSelect(database, 'SELECT last_insert_rowid() AS id', [])[0];
    persist();
    const rows = runSelect(database, `SELECT * FROM ${table} WHERE id = ?`, [idRow.id]);
    if (config.nodeEnv === 'development') {
      console.log('sql.js query', { duration: Date.now() - start, rows: rows.length });
    }
    return { rows, rowCount: rows.length };
  }

  if (/^\s*UPDATE/i.test(text) && /RETURNING/i.test(text)) {
    const tableMatch = text.match(/UPDATE\s+(\w+)/i);
    const table = tableMatch?.[1];
    const idParam = sqliteParams[sqliteParams.length - 1];
    const updateSql = sql.replace(/RETURNING.*/i, '').trim();
    database.run(updateSql, sqliteParams);
    persist();
    const rows = runSelect(database, `SELECT * FROM ${table} WHERE id = ?`, [idParam]);
    return { rows, rowCount: rows.length };
  }

  if (/^\s*SELECT/i.test(text)) {
    const rows = runSelect(database, sql, sqliteParams);
    if (rows.length) {
      const keys = Object.keys(rows[0]);
      const countKey = keys.find((k) => k.toLowerCase().includes('count'));
      if (countKey && keys.length === 1) {
        rows[0].count = String(rows[0][countKey]);
      }
    }
    return { rows, rowCount: rows.length };
  }

  database.run(sql, sqliteParams);
  persist();
  return { rows: [], rowCount: database.getRowsModified() };
}

export const pool = { end: async () => { if (db) { persist(); db.close(); } } };
