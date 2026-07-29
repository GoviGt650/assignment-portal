import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '../..');
const envPath = path.join(backendRoot, '.env');
const examplePath = path.join(backendRoot, '.env.example');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue = '') {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log('\nAcademy ASP — backend .env setup\n');

  if (fs.existsSync(envPath)) {
    const overwrite = await ask('.env already exists. Overwrite? (y/N)', 'N');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled. Edit backend/.env manually.');
      rl.close();
      return;
    }
  }

  if (!fs.existsSync(examplePath)) {
    console.error('Missing backend/.env.example');
    rl.close();
    process.exit(1);
  }

  let template = fs.readFileSync(examplePath, 'utf8');

  console.log('\nSMTP (Brevo) — press Enter to skip and use dev console OTP\n');

  const smtpHost = await ask('SMTP_HOST', 'smtp-relay.brevo.com');
  const smtpPort = await ask('SMTP_PORT', '587');
  const smtpUser = await ask('SMTP_USER (xxx@smtp-brevo.com)');
  const smtpPass = await ask('SMTP_PASS (Brevo SMTP key)');
  const emailFrom = await ask('EMAIL_FROM', 'Academy ASP <your-email@gmail.com>');
  const teacherNotify = await ask('TEACHER_NOTIFY_EMAIL (optional — submission alerts)');

  template = template
    .replace(/^SMTP_HOST=.*$/m, `SMTP_HOST=${smtpHost}`)
    .replace(/^SMTP_PORT=.*$/m, `SMTP_PORT=${smtpPort}`)
    .replace(/^SMTP_USER=.*$/m, `SMTP_USER=${smtpUser}`)
    .replace(/^SMTP_PASS=.*$/m, `SMTP_PASS=${smtpPass}`)
    .replace(/^EMAIL_FROM=.*$/m, `EMAIL_FROM=${emailFrom}`);

  if (/^TEACHER_NOTIFY_EMAIL=/m.test(template)) {
    template = template.replace(/^TEACHER_NOTIFY_EMAIL=.*$/m, `TEACHER_NOTIFY_EMAIL=${teacherNotify}`);
  } else if (teacherNotify) {
    template += `\nTEACHER_NOTIFY_EMAIL=${teacherNotify}\n`;
  }

  fs.writeFileSync(envPath, template, 'utf8');
  console.log(`\nCreated ${envPath}`);
  console.log('Restart the backend: npm run dev\n');
  rl.close();
}

main().catch((err) => {
  console.error(err.message);
  rl.close();
  process.exit(1);
});
