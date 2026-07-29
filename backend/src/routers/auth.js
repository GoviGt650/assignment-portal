import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { hashPassword, verifyPassword, createToken } from '../services/authService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ValidationError, AuthError } from '../middleware/errors.js';
import { createOtp, verifyOtp, publicUser } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';
import { maskEmail } from '../utils/maskEmail.js';

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

function otpResponse(sent, message, email, extra = {}) {
  return {
    message,
    email,
    masked_email: maskEmail(email),
    expires_in_minutes: 10,
    dev_mode: sent.dev,
    ...extra,
  };
}

async function resolveAccountForRecovery({ email, username }) {
  const hasEmail = Boolean(email?.trim());
  const hasUsername = Boolean(username?.trim());

  if (hasEmail === hasUsername) {
    throw new ValidationError('Provide either email or username');
  }

  if (hasEmail) {
    const normalized = normalizeEmail(email);
    const result = await query(
      `SELECT id, username, email, role FROM users WHERE email = $1`,
      [normalized]
    );
    return result.rows[0] || null;
  }

  const result = await query(
    `SELECT id, username, email, role FROM users WHERE username = $1`,
    [username.trim().toLowerCase()]
  );
  return result.rows[0] || null;
}

async function requireRegisteredEmail(userId) {
  const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
  const email = userResult.rows[0]?.email;
  if (!email) {
    throw new ValidationError('Add a verified email to your account first');
  }
  return normalizeEmail(email);
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
      res.json(otpResponse(
        sent,
        sent.dev
          ? 'Development mode: code printed in backend terminal (SMTP not configured).'
          : 'Verification code sent to your email.',
        email,
        { masked_email: maskEmail(email) }
      ));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/change-email',
  authenticate,
  requireRole('student', 'teacher'),
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
      res.json(otpResponse(
        sent,
        sent.dev ? 'Development mode: code printed in backend terminal.' : 'Code sent to your new email.',
        email
      ));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/change-password',
  authenticate,
  requireRole('student', 'teacher'),
  async (req, res, next) => {
    try {
      const email = await requireRegisteredEmail(req.user.sub);
      const code = await createOtp({ email, purpose: 'change_password', userId: req.user.sub });
      const sent = await sendOtpEmail(email, code, 'change_password');
      res.json(otpResponse(
        sent,
        sent.dev ? 'Development mode: code printed in backend terminal.' : 'Code sent to your registered email.',
        email
      ));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/setup-email',
  authenticate,
  requireRole('teacher'),
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    try {
      validate(req);
      const email = normalizeEmail(req.body.email);

      const userResult = await query('SELECT email FROM users WHERE id = $1', [req.user.sub]);
      if (userResult.rows[0]?.email) {
        throw new ValidationError('Your account already has an email. Use account settings to change it.');
      }

      const taken = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (taken.rows.length > 0) {
        throw new ValidationError('This email is already registered');
      }

      const code = await createOtp({ email, purpose: 'setup_email', userId: req.user.sub });
      const sent = await sendOtpEmail(email, code, 'setup_email');
      res.json(otpResponse(
        sent,
        sent.dev ? 'Development mode: code printed in backend terminal.' : 'Verification code sent to your email.',
        email
      ));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/change-username',
  authenticate,
  requireRole('teacher'),
  async (req, res, next) => {
    try {
      const email = await requireRegisteredEmail(req.user.sub);
      const code = await createOtp({ email, purpose: 'change_username', userId: req.user.sub });
      const sent = await sendOtpEmail(email, code, 'change_username');
      res.json(otpResponse(
        sent,
        sent.dev ? 'Development mode: code printed in backend terminal.' : 'Code sent to your registered email.',
        email
      ));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/forgot-password/lookup',
  async (req, res, next) => {
    try {
      const { email, username } = req.body;
      const account = await resolveAccountForRecovery({ email, username });
      const genericMessage = 'If an account exists with a registered email, you can request a reset code.';

      if (!account?.email) {
        return res.json({ message: genericMessage, found: false });
      }

      res.json({
        message: genericMessage,
        found: true,
        masked_email: maskEmail(account.email),
        username: account.username,
        role: account.role,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/otp/send/forgot-password',
  async (req, res, next) => {
    try {
      const { email, username } = req.body;
      const account = await resolveAccountForRecovery({ email, username });
      const genericMessage = 'If an account exists with a registered email, a reset code has been sent.';

      if (!account?.email) {
        return res.json({
          message: genericMessage,
          found: false,
          dev_mode: false,
        });
      }

      const resolvedEmail = normalizeEmail(account.email);
      const code = await createOtp({
        email: resolvedEmail,
        purpose: 'forgot_password',
        userId: account.id,
      });
      const sent = await sendOtpEmail(resolvedEmail, code, 'forgot_password');
      res.json({
        ...otpResponse(sent, genericMessage, resolvedEmail),
        found: true,
        username: account.username,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reset-password',
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
      const { email, username, otp, new_password: newPassword } = req.body;
      const account = await resolveAccountForRecovery({ email, username });

      if (!account?.email) {
        throw new ValidationError('No account found with a registered email');
      }

      const resolvedEmail = normalizeEmail(account.email);
      await verifyOtp({ email: resolvedEmail, purpose: 'forgot_password', otp });

      const nextPasswordHash = await hashPassword(newPassword);
      await query('UPDATE users SET password = $1 WHERE id = $2', [nextPasswordHash, account.id]);

      res.json({ message: 'Password reset successfully. You can sign in with your new password.' });
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

      await verifyOtp({ email, purpose: 'register', otp });

      const existingUser = await query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        throw new ValidationError('Username already taken');
      }

      const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail.rows.length > 0) {
        throw new ValidationError('Email already registered');
      }

      const hashed = await hashPassword(password);
      const result = await query(
        `INSERT INTO users (username, password, role, email, email_verified)
         VALUES ($1, $2, 'student', $3, 1)
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
  '/account/setup-email',
  authenticate,
  requireRole('teacher'),
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
    body('current_password').notEmpty().withMessage('Current password is required'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const email = normalizeEmail(req.body.email);
      const { otp, current_password: currentPassword } = req.body;

      const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
      const user = userResult.rows[0];
      if (!user) {
        throw new AuthError('User not found');
      }
      if (user.email) {
        throw new ValidationError('Your account already has an email. Use account settings to change it.');
      }

      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) {
        throw new AuthError('Current password is incorrect');
      }

      await verifyOtp({ email, purpose: 'setup_email', otp });

      const taken = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (taken.rows.length > 0) {
        throw new ValidationError('This email is already registered');
      }

      const result = await query(
        `UPDATE users SET email = $1, email_verified = 1 WHERE id = $2
         RETURNING id, username, role, email, email_verified, created_at`,
        [email, user.id]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      res.json({
        message: 'Email added successfully. You can now recover your account and receive notifications.',
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
  '/account/email',
  authenticate,
  requireRole('student', 'teacher'),
  [
    body('new_email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const newEmail = normalizeEmail(req.body.new_email);
      const { otp } = req.body;

      await verifyOtp({ email: newEmail, purpose: 'change_email', otp });

      const taken = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, req.user.sub]);
      if (taken.rows.length > 0) {
        throw new ValidationError('Email already registered');
      }

      const result = await query(
        `UPDATE users SET email = $1, email_verified = 1 WHERE id = $2
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
  '/account/username',
  authenticate,
  requireRole('teacher'),
  [
    body('new_username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { new_username: newUsername, otp } = req.body;

      const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
      const user = userResult.rows[0];
      if (!user?.email) {
        throw new ValidationError('Add a verified email to your account first');
      }

      await verifyOtp({ email: user.email, purpose: 'change_username', otp });

      const normalized = newUsername.trim().toLowerCase();
      if (normalized === user.username) {
        throw new ValidationError('This is already your username');
      }

      const existing = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [
        normalized,
        user.id,
      ]);
      if (existing.rows.length > 0) {
        throw new ValidationError('Username already taken');
      }

      const result = await query(
        `UPDATE users SET username = $1 WHERE id = $2
         RETURNING id, username, role, email, email_verified, created_at`,
        [normalized, user.id]
      );

      const updatedUser = result.rows[0];
      const token = createToken(updatedUser);
      res.json({
        message: 'Username updated successfully',
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
  requireRole('student', 'teacher'),
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
