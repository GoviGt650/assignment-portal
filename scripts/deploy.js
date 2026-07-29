#!/usr/bin/env node
/**
 * Run after filling in deploy/.env.deploy (copy from deploy/.env.deploy.example)
 * Usage: node scripts/deploy.js
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, 'deploy', '.env.deploy');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('Missing deploy/.env.deploy — copy deploy/.env.deploy.example and fill in values.');
    process.exit(1);
  }
  const vars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

function run(cmd, cwd = root) {
  console.log('\n>', cmd);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

const env = loadEnv();
const required = ['GITHUB_REPO_URL', 'GITHUB_PAT', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET', 'TEACHER_PASSWORD', 'VERCEL_TOKEN'];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing ${key} in deploy/.env.deploy`);
    process.exit(1);
  }
}

const repoUrl = env.GITHUB_REPO_URL.replace('https://github.com/', 'https://' + env.GITHUB_PAT + '@github.com/');

// Push to GitHub
run('git init');
run('git add .');
try {
  run('git commit -m "Deploy Academy Assignment Portal"');
} catch {
  console.log('Nothing new to commit or commit failed — continuing');
}
run(`git branch -M main`);
run(`git remote remove origin`, root);
try { run(`git remote add origin ${env.GITHUB_REPO_URL}`); } catch { run(`git remote set-url origin ${env.GITHUB_REPO_URL}`); }
run(`git push -u ${repoUrl} main --force`);

console.log('\n✅ Code pushed to GitHub.');
console.log('\nNext: Deploy backend on Render (connect repo, root: backend) with these env vars:\n');
console.log(`USE_SQLITE=false
NODE_ENV=production
DATABASE_URL=${env.DATABASE_URL}
JWT_SECRET=${env.JWT_SECRET}
JWT_EXPIRES_IN=7d
FRONTEND_URL=(set after Vercel deploy)
TEACHER_USERNAME=teacher
TEACHER_PASSWORD=${env.TEACHER_PASSWORD}
STORAGE_TYPE=supabase
SUPABASE_URL=${env.SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY}
MAX_FILE_SIZE_MB=200
PORT=8000`);

console.log('\nDeploy frontend:');
console.log(`cd frontend && npx vercel --token ${env.VERCEL_TOKEN} --prod --yes`);
console.log(`Set VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api`);
