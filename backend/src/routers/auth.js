import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { hashPassword, verifyPassword, createToken } from '../services/authService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ValidationError, AuthError } from '../middleware/errors.js';
import { createOtp, verifyOtp, publicUser } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = Router();

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

router.post(
  '/otp/send/register',
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    try {
      validate(req);
      const email = normalizeEmail(req.body.email);
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new ValidationError('This email is already registered');
      }
      const code = await createOtp({ email, purpose: 'register' });
      const sent = await sendOtpEmail(email, code, 'register');
      res.json({
        message: sent.dev
          ? 'Verification code generated. Check the backend console in development.'
          : 'Verification code sent to your email.',
        email,
        expires_in_minutes: 10,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/change-email',
  authenticate,
  requireRole('student'),
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    try {
      validate(req);
      const email = normalizeEmail(req.body.email);
      const taken = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.sub]);
      if (taken.rows.length > 0) {
        throw new ValidationError('This email is already registered');
      }
      const code = await createOtp({ email, purpose: 'change_email', userId: req.user.sub });
      const sent = await sendOtpEmail(email, code, 'change_email');
      res.json({
        message: sent.dev ? 'Code generated. Check the backend console.' : 'Code sent to your new email.',
        email,
        expires_in_minutes: 10,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/change-password',
  authenticate,
  requireRole('student'),
  async (req, res, next) => {
    try {
      const userResult = await query('SELECT email FROM users WHERE id = $1', [req.user.sub]);
      const email = userResult.rows[0]?.email;
      if (!email) {
        throw new ValidationError('Add a verified email to your account first');
      }
      const code = await createOtp({ email, purpose: 'change_password', userId: req.user.sub });
      const sent = await sendOtpEmail(email, code, 'change_password');
      res.json({
        message: sent.dev ? 'Code generated. Check the backend console.' : 'Code sent to your registered email.',
        email,
        expires_in_minutes: 10,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { username, password, otp } = req.body;
      const email = normalizeEmail(req.body.email);

      const existingUser = await query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        throw new ValidationError('Username already taken');
      }

      const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail.rows.length > 0) {
        throw new ValidationError('Email already registered');
      }

      await verifyOtp({ email, purpose: 'register', otp });

      const hashed = await hashPassword(password);
      const result = await query(
        `INSERT INTO users (username, password, role, email, email_verified)
         VALUES ($1, $2, 'student', $3, true)
         RETURNING id, username, role, email, email_verified, created_at`,
        [username.toLowerCase(), hashed, email]
      );
      const user = result.rows[0];
      const token = createToken(user);
      res.status(201).json({ access_token: token, token_type: 'bearer', user: publicUser(user) });
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
      res.json({ access_token: token, token_type: 'bearer', user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, username, role, email, email_verified, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (result.rows.length === 0) {
      throw new AuthError('User not found');
    }
    res.json(publicUser(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/account/email',
  authenticate,
  requireRole('student'),
  [
    body('new_email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const newEmail = normalizeEmail(req.body.new_email);
      const { otp } = req.body;

      const taken = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, req.user.sub]);
      if (taken.rows.length > 0) {
        throw new ValidationError('Email already registered');
      }

      await verifyOtp({ email: newEmail, purpose: 'change_email', otp });

      const result = await query(
        `UPDATE users SET email = $1, email_verified = true WHERE id = $2
         RETURNING id, username, role, email, email_verified, created_at`,
        [newEmail, req.user.sub]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      res.json({
        message: 'Email updated successfully',
        access_token: token,
        token_type: 'bearer',
        user: publicUser(updatedUser),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/account/password',
  authenticate,
  requireRole('student'),
  [
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { otp, new_password: newPassword } = req.body;

      const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
      const user = userResult.rows[0];
      if (!user?.email) {
        throw new ValidationError('Add a verified email to your account first');
      }

      await verifyOtp({ email: user.email, purpose: 'change_password', otp });

      const nextPasswordHash = await hashPassword(newPassword);
      const result = await query(
        `UPDATE users SET password = $1 WHERE id = $2
         RETURNING id, username, role, email, email_verified, created_at`,
        [nextPasswordHash, user.id]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      res.json({
        message: 'Password updated successfully',
        access_token: token,
        token_type: 'bearer',
        user: publicUser(updatedUser),
      });
    } catch (err) {
      next(err);
    }
  }
);

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
        `UPDATE users SET username = $1, password = $2 WHERE id = $3
         RETURNING id, username, role, email, email_verified, created_at`,
        [nextUsername, nextPasswordHash, user.id]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      res.json({
        message: 'Profile updated successfully',
        access_token: token,
        token_type: 'bearer',
        user: publicUser(updatedUser),
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
      `SELECT COUNT(*) FROM users WHERE role = 'student' AND (username ILIKE $1 OR email ILIKE $1)`,
      [searchTerm]
    );
    const result = await query(
      `SELECT id, username, email, email_verified, role, created_at FROM users
       WHERE role = 'student' AND (username ILIKE $1 OR email ILIKE $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [searchTerm, parseInt(limit, 10), offset]
    );
    res.json({
      items: result.rows.map((row) => publicUser(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
