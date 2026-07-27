import { query, pool } from '../db.js';
import { hashPassword } from '../services/authService.js';
import { config } from '../config.js';

async function resetTeacher() {
  const existing = await query(
    'SELECT id FROM users WHERE username = $1 AND role = $2',
    [config.teacher.username, 'teacher']
  );

  if (existing.rows.length === 0) {
    console.error(`No teacher account found with username "${config.teacher.username}".`);
    process.exit(1);
  }

  const hashed = await hashPassword(config.teacher.password);
  await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, existing.rows[0].id]);

  console.log(`Teacher password reset: ${config.teacher.username} / ${config.teacher.password}`);
  await pool.end();
}

resetTeacher().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
