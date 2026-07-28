import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { ValidationError } from '../middleware/errors.js';

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_PER_WINDOW = 5;
const OTP_WINDOW_MINUTES = 15;

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function publicUser(user) {
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    email_verified: Boolean(user.email_verified),
  };
}

export async function createOtp({ email, purpose, userId = null }) {
  const normalizedEmail = email.trim().toLowerCase();
  const windowStart = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000).toISOString();

  const recent = await query(
    `SELECT created_at FROM email_otps
     WHERE email = $1 AND purpose = $2 AND created_at > $3
     ORDER BY created_at DESC`,
    [normalizedEmail, purpose, windowStart]
  );

  if (recent.rows.length >= OTP_MAX_PER_WINDOW) {
    throw new ValidationError('Too many code requests. Please try again later.');
  }

  const latest = recent.rows[0];
  if (latest?.created_at) {
    const elapsedSeconds = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new ValidationError(`Please wait ${wait}s before requesting another code.`);
    }
  }

  await query(
    `DELETE FROM email_otps WHERE email = $1 AND purpose = $2`,
    [normalizedEmail, purpose]
  );

  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await query(
    `INSERT INTO email_otps (email, otp_hash, purpose, user_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [normalizedEmail, otpHash, purpose, userId, expiresAt]
  );

  return code;
}

export async function verifyOtp({ email, purpose, otp }) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await query(
    `SELECT * FROM email_otps
     WHERE email = $1 AND purpose = $2 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, purpose]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Code expired or not found. Request a new one.');
  }

  const record = result.rows[0];
  const valid = await bcrypt.compare(String(otp).trim(), record.otp_hash);
  if (!valid) {
    throw new ValidationError('Invalid verification code. Please check and try again.');
  }

  await query('DELETE FROM email_otps WHERE id = $1', [record.id]);
  return record;
}
