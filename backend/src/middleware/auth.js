import { AuthError, ForbiddenError } from './errors.js';
import { verifyToken } from '../services/authService.js';
import { query } from '../db.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AuthError('Authentication required'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = payload;
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user?.sub) {
        return next(new ForbiddenError('Insufficient permissions'));
      }
      const result = await query(
        'SELECT role FROM users WHERE id = $1',
        [req.user.sub]
      );
      const role = result.rows[0]?.role || req.user.role;
      if (!role || !roles.includes(role)) {
        return next(new ForbiddenError('Insufficient permissions'));
      }
      req.user.role = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function loadUser(req, res, next) {
  try {
    const result = await query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (result.rows.length === 0) {
      return next(new AuthError('User not found'));
    }
    req.currentUser = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}
