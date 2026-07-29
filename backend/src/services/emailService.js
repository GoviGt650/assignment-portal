import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter;

function isEmailConfigured() {
  return Boolean(config.email.smtp.user && config.email.smtp.pass);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  }
  return transporter;
}

const purposeLabels = {
  register: 'complete your student registration',
  change_email: 'confirm your new email address',
  change_password: 'change your password',
  forgot_password: 'reset your password',
};

function buildEmailHtml(otp, label) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px">
                    <p style="margin:0;color:#dbeafe;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Academy ASP</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.3">Verification code</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px">
                    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6">
                      Use this code to ${label}:
                    </p>
                    <div style="text-align:center;padding:20px 0 24px">
                      <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:10px;color:#0f172a">${otp}</span>
                    </div>
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6">
                      This code expires in 10 minutes. If you did not request it, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildNotificationHtml({ title, lines }) {
  const body = lines.map((line) => `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6">${line}</p>`).join('');
  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px">
                    <p style="margin:0;color:#dbeafe;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Academy ASP</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.3">${title}</h1>
                  </td>
                </tr>
                <tr><td style="padding:32px">${body}</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getEmailStatus() {
  return {
    configured: isEmailConfigured(),
    mode: isEmailConfigured() ? 'smtp' : 'dev-fallback',
  };
}

export async function sendOtpEmail(to, otp, purpose) {
  const label = purposeLabels[purpose] || 'verify your request';
  const subject = `${otp} - Academy ASP verification code`;
  const text = `Your Academy ASP verification code is ${otp}. Use it to ${label}. Expires in 10 minutes.`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV OTP] To: ${to} | Code: ${otp} | Purpose: ${purpose}`);
    return { dev: true };
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html: buildEmailHtml(otp, label),
    });
    return { dev: false };
  } catch (err) {
    throw new Error(err.message || 'Could not send verification email');
  }
}

export async function sendSubmissionNotification({ teacherEmail, studentUsername, assignmentTitle, status }) {
  if (!teacherEmail) return { skipped: true, reason: 'no-teacher-email' };

  const subject = `New submission: ${studentUsername} — ${assignmentTitle}`;
  const text = [
    `${studentUsername} submitted work for "${assignmentTitle}".`,
    `Status: ${status}`,
    'Sign in to the teacher portal to review.',
  ].join('\n');

  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV NOTIFY] To: ${teacherEmail} | ${text.replace(/\n/g, ' | ')}`);
    return { dev: true };
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to: teacherEmail,
      subject,
      text,
      html: buildNotificationHtml({
        title: 'New student submission',
        lines: [
          `<strong>${studentUsername}</strong> submitted work for <strong>${assignmentTitle}</strong>.`,
          `Status: <strong>${status}</strong>`,
          'Sign in to the teacher portal to review and add feedback.',
        ],
      }),
    });
    return { dev: false };
  } catch (err) {
    console.error('[email] Submission notification failed:', err.message);
    return { error: err.message };
  }
}

export { isEmailConfigured };
