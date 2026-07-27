import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { hashPassword, verifyPassword, createToken } from '../services/authService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ValidationError, AuthError } from '../middleware/errors.js';

const router = Router();

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
  }
}

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { username, password } = req.body;
      const existing = await query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
      if (existing.rows.length > 0) {
        throw new ValidationError('Username already taken');
      }
      const hashed = await hashPassword(password);
      const result = await query(
        `INSERT INTO users (username, password, role) VALUES ($1, $2, 'student') RETURNING id, username, role, created_at`,
        [username.toLowerCase(), hashed]
      );
      const user = result.rows[0];
      const token = createToken(user);
      const { password: _, ...safeUser } = user;
      res.status(201).json({ access_token: token, token_type: 'bearer', user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { username, password } = req.body;
      const result = await query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
      if (result.rows.length === 0) {
        throw new AuthError('Invalid username or password');
      }
      const user = result.rows[0];
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        throw new AuthError('Invalid username or password');
      }
      const token = createToken(user);
      const { password: _, ...safeUser } = user;
      res.json({ access_token: token, token_type: 'bearer', user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (result.rows.length === 0) {
      throw new AuthError('User not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/profile',
  authenticate,
  requireRole('teacher'),
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('new_password').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').optional(),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { current_password, new_username, new_password, confirm_password } = req.body;

      if (!new_username && !new_password) {
        throw new ValidationError('Provide a new username or new password to update');
      }

      if (new_password && new_password !== confirm_password) {
        throw new ValidationError('New passwords do not match');
      }

      const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
      if (userResult.rows.length === 0) {
        throw new AuthError('User not found');
      }

      const user = userResult.rows[0];
      const valid = await verifyPassword(current_password, user.password);
      if (!valid) {
        throw new AuthError('Current password is incorrect');
      }

      let nextUsername = user.username;
      let nextPasswordHash = user.password;

      if (new_username && new_username.toLowerCase() !== user.username) {
        const existing = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [
          new_username.toLowerCase(),
          user.id,
        ]);
        if (existing.rows.length > 0) {
          throw new ValidationError('Username already taken');
        }
        nextUsername = new_username.toLowerCase();
      }

      if (new_password) {
        nextPasswordHash = await hashPassword(new_password);
      }

      const result = await query(
        `UPDATE users SET username = $1, password = $2 WHERE id = $3 RETURNING id, username, role, created_at`,
        [nextUsername, nextPasswordHash, user.id]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      const { password: _, ...safeUser } = updatedUser;

      res.json({
        message: 'Profile updated successfully',
        access_token: token,
        token_type: 'bearer',
        user: safeUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/students', authenticate, requireRole('teacher'), async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const searchTerm = `%${search}%`;
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE role = 'student' AND username ILIKE $1`,
      [searchTerm]
    );
    const result = await query(
      `SELECT id, username, role, created_at FROM users
       WHERE role = 'student' AND username ILIKE $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [searchTerm, parseInt(limit, 10), offset]
    );
    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
