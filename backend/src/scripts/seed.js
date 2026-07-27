import { query, pool } from '../db.js';
import { hashPassword } from '../services/authService.js';
import { config } from '../config.js';

async function seed() {
  const existing = await query(
    'SELECT id FROM users WHERE username = $1',
    [config.teacher.username]
  );

  if (existing.rows.length === 0) {
    const hashed = await hashPassword(config.teacher.password);
    await query(
      `INSERT INTO users (username, password, role) VALUES ($1, $2, 'teacher')`,
      [config.teacher.username, hashed]
    );
    console.log(`Teacher account created: ${config.teacher.username} / ${config.teacher.password}`);
  } else {
    console.log('Teacher account already exists.');
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
