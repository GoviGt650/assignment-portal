import express from 'express';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errors.js';
import { initStorage } from './services/storageService.js';
import { isEmailConfigured, getEmailStatus } from './services/emailService.js';

import authRouter from './routers/auth.js';
import assignmentsRouter from './routers/assignments.js';
import submissionsRouter from './routers/submissions.js';
import dashboardRouter from './routers/dashboard.js';
import filesRouter from './routers/files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

function isDevLanOrigin(origin) {
  if (!origin) return true;
  return (
    /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin) ||
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin) ||
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin) ||
    origin === config.frontendUrl
  );
}

app.use(cors({
  origin(origin, callback) {
    if (config.nodeEnv === 'development' && isDevLanOrigin(origin)) {
      return callback(null, true);
    }
    if (origin === config.frontendUrl) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await initStorage();

if (isEmailConfigured()) {
  console.log('[email] Brevo SMTP configured.');
} else {
  console.log('[email] SMTP not set — OTP codes will print in the console.');
}

app.get('/api/health', (_req, res) => {
  const email = getEmailStatus();
  res.json({
    status: 'ok',
    service: 'Academy Assignment Portal API',
    version: '1.0.0',
    email: {
      configured: email.configured,
      mode: email.mode,
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/files', filesRouter);

app.use(errorHandler);

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

app.listen(config.port, '0.0.0.0', () => {
  console.log(`API running on http://localhost:${config.port}`);
  if (config.nodeEnv === 'development') {
    for (const ip of getLanAddresses()) {
      console.log(`  On your WiFi network: http://${ip}:${config.port}`);
    }
  }
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
