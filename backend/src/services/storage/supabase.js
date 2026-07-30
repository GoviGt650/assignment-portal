import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config.js';
import { ValidationError } from '../../middleware/errors.js';

let supabase;

const BUCKETS = {
  assignment: 'assignments',
  submission: 'submissions',
};

/** Supabase free tier global file size limit (MB). Pro plans allow higher. */
const SUPABASE_MAX_FILE_SIZE_MB = 50;

function buildPublicUrl(type, filename) {
  return `/api/files/${BUCKETS[type]}/${filename}`;
}

function uniqueName(originalName) {
  const safe = path.basename(originalName);
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
}

function getClient() {
  if (!supabase) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new ValidationError('Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

export async function initStorage() {
  const client = getClient();
  const { data: buckets } = await client.storage.listBuckets();
  const existing = new Set((buckets || []).map((b) => b.name));

  const bucketLimitMb = Math.min(config.storage.maxFileSizeMb, SUPABASE_MAX_FILE_SIZE_MB);
  if (config.storage.maxFileSizeMb > SUPABASE_MAX_FILE_SIZE_MB) {
    console.warn(
      `[storage] MAX_FILE_SIZE_MB=${config.storage.maxFileSizeMb} exceeds Supabase limit (${SUPABASE_MAX_FILE_SIZE_MB} MB on free tier). Buckets use ${bucketLimitMb} MB.`
    );
  }

  for (const bucket of Object.values(BUCKETS)) {
    if (existing.has(bucket)) continue;
    const { error } = await client.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: bucketLimitMb * 1024 * 1024,
    });
    if (error && !/already exists/i.test(error.message)) {
      console.warn(`Bucket "${bucket}":`, error.message);
    }
  }
  console.log('Supabase Storage ready (assignments + submissions buckets).');
}

export async function saveFile(type, file) {
  const client = getClient();
  const bucket = BUCKETS[type];
  const name = uniqueName(file.originalname);
  const buffer = await fs.readFile(file.path);
  try {
    await fs.unlink(file.path);
  } catch {
    // ignore
  }

  const { error } = await client.storage.from(bucket).upload(name, buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    console.error(`[storage] Supabase upload failed bucket=${bucket} file=${name}:`, error.message);
    throw new ValidationError(`Upload failed: ${error.message}`);
  }

  console.log(`[storage] uploaded ${bucket}/${name} (${buffer.length} bytes)`);

  return { filename: name, url: buildPublicUrl(type, name) };
}

export async function saveBuffer(type, buffer, originalName, contentType = 'application/octet-stream') {
  const client = getClient();
  const bucket = BUCKETS[type];
  const name = uniqueName(originalName);

  const { error } = await client.storage.from(bucket).upload(name, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new ValidationError(`Upload failed: ${error.message}`);

  return { filename: name, url: buildPublicUrl(type, name), contentType };
}

export async function saveFromPath(type, filePath, originalName, contentType) {
  const buffer = await fs.readFile(filePath);
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
  return saveBuffer(type, buffer, originalName, contentType);
}

export async function deleteFile(type, filename) {
  if (!filename) return;
  const client = getClient();
  const bucket = BUCKETS[type];
  const safeName = path.basename(filename);
  await client.storage.from(bucket).remove([safeName]);
}

export async function streamFile(urlType, filename, res, options = {}) {
  const { inline = false, downloadName } = options;
  const client = getClient();
  const safeName = path.basename(filename);

  const { data, error } = await client.storage.from(urlType).download(safeName);
  if (error || !data) {
    console.error(
      `[storage] Supabase download failed bucket=${urlType} file=${safeName}:`,
      error?.message || 'no data returned'
    );
    return false;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0) {
    console.error(`[storage] Supabase file empty bucket=${urlType} file=${safeName}`);
    return false;
  }
  const contentType = data.type || 'application/octet-stream';
  const outputName = downloadName || safeName;

  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${outputName}"`
  );
  res.send(buffer);
  return true;
}

export function filenameFromUrl(url) {
  if (!url) return null;
  return url.split('/').pop();
}
