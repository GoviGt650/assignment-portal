import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter;

function hasSmtpConfig() {
  return Boolean(config.email.smtp.user && config.email.smtp.pass);
}

function hasBrevoApiConfig() {
  return Boolean(config.email.brevoApiKey);
}

function isEmailConfigured() {
  return hasBrevoApiConfig() || hasSmtpConfig();
}

function parseFromAddress(from) {
  const value = String(from || '').trim();
  const match = value.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'Academy ASP', email: value };
}

function getTransporter() {
  if (!hasSmtpConfig()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  }
  return transporter;
}

async function sendViaBrevoApi({ to, subject, text, html }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.email.brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: parseFromAddress(config.email.from),
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `Brevo API error ${response.status}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    return { messageId: body || 'sent' };
  }
}

async function sendViaSmtp({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) return null;
  return transport.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    html,
  });
}

function formatEmailError(err) {
  const msg = String(err.message || '');
  if (/sender.*not valid|validate your sender|authenticate your domain/i.test(msg)) {
    return `Brevo rejected the sender "${config.email.from}". In Brevo go to Senders & IP → Senders, add that exact email, verify it via the link, then restart the backend.`;
  }
  if (/connection timeout|timed out/i.test(msg)) {
    return 'Email service timed out. On Render, set BREVO_API_KEY (Brevo → SMTP & API → API Keys) instead of SMTP only.';
  }
  return msg || 'Could not send email';
}

async function deliverEmail({ to, subject, text, html, logLabel }) {
  if (!isEmailConfigured()) {
    console.log(`[DEV ${logLabel}] To: ${to} | ${text.replace(/\n/g, ' | ')}`);
    return { dev: true };
  }

  if (hasBrevoApiConfig()) {
    try {
      const info = await sendViaBrevoApi({ to, subject, text, html });
      console.log(`[email] ${logLabel} sent via Brevo API to ${to} messageId=${info.messageId || 'n/a'}`);
      return { dev: false, via: 'brevo-api' };
    } catch (err) {
      console.error(`[email] Brevo API failed for ${to}:`, err.message);
      if (!hasSmtpConfig()) {
        throw new Error(formatEmailError(err));
      }
      console.warn('[email] Falling back to SMTP after Brevo API failure.');
    }
  }

  try {
    const info = await sendViaSmtp({ to, subject, text, html });
    console.log(`[email] ${logLabel} sent via SMTP to ${to} messageId=${info?.messageId || 'n/a'}`);
    return { dev: false, via: 'smtp' };
  } catch (err) {
    console.error(`[email] SMTP failed for ${to}:`, err.message);
    throw new Error(formatEmailError(err));
  }
}

const purposeLabels = {
  register: 'complete your student registration',
  setup_email: 'verify your teacher account email',
  change_email: 'confirm your new email address',
  change_password: 'change your password',
  change_username: 'change your username',
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
  if (hasBrevoApiConfig()) {
    return { configured: true, mode: 'brevo-api' };
  }
  if (hasSmtpConfig()) {
    return { configured: true, mode: 'smtp' };
  }
  return { configured: false, mode: 'dev-fallback' };
}

export async function sendOtpEmail(to, otp, purpose) {
  const label = purposeLabels[purpose] || 'verify your request';
  const subject = `${otp} - Academy ASP verification code`;
  const text = `Your Academy ASP verification code is ${otp}. Use it to ${label}. Expires in 10 minutes.`;

  return deliverEmail({
    to,
    subject,
    text,
    html: buildEmailHtml(otp, label),
    logLabel: `OTP (${purpose})`,
  });
}

export async function sendSubmissionNotification({ teacherEmail, studentUsername, assignmentTitle, status }) {
  if (!teacherEmail) return { skipped: true, reason: 'no-teacher-email' };

  const subject = `New submission: ${studentUsername} — ${assignmentTitle}`;
  const text = [
    `${studentUsername} submitted work for "${assignmentTitle}".`,
    `Status: ${status}`,
    'Sign in to the teacher portal to review.',
  ].join('\n');

  try {
    return await deliverEmail({
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
      logLabel: 'Submission notification',
    });
  } catch (err) {
    console.error('[email] Submission notification failed:', err.message);
    return { error: err.message };
  }
}

export { isEmailConfigured };
