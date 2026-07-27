import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { config } from '../../config.js';

const ASSIGNMENTS_DIR = path.join(config.storage.uploadDir, 'assignments');
const SUBMISSIONS_DIR = path.join(config.storage.uploadDir, 'submissions');

function folderFor(type) {
  return type === 'assignment' ? ASSIGNMENTS_DIR : SUBMISSIONS_DIR;
}

function urlFolderFor(type) {
  return type === 'assignment' ? 'assignments' : 'submissions';
}

async function ensureDirs() {
  await fs.mkdir(ASSIGNMENTS_DIR, { recursive: true });
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
}

export async function initStorage() {
  await ensureDirs();
}

export function buildPublicUrl(type, filename) {
  return `/api/files/${urlFolderFor(type)}/${filename}`;
}

function uniqueName(originalName) {
  const safe = path.basename(originalName);
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
}

export async function saveFile(type, file) {
  await ensureDirs();
  const name = uniqueName(file.originalname);
  const dest = path.join(folderFor(type), name);
  await fs.rename(file.path, dest);
  return { filename: name, url: buildPublicUrl(type, name), path: dest };
}

export async function saveBuffer(type, buffer, originalName, contentType = 'application/octet-stream') {
  await ensureDirs();
  const name = uniqueName(originalName);
  const dest = path.join(folderFor(type), name);
  await fs.writeFile(dest, buffer);
  return { filename: name, url: buildPublicUrl(type, name), path: dest, contentType };
}

export async function saveFromPath(type, filePath, originalName, contentType) {
  const buffer = await fs.readFile(filePath);
  try {
    await fs.unlink(filePath);
  } catch {
    // temp file may already be removed
  }
  return saveBuffer(type, buffer, originalName, contentType);
}

export async function deleteFile(type, filename) {
  if (!filename) return;
  const filePath = path.join(folderFor(type), path.basename(filename));
  try {
    await fs.unlink(filePath);
  } catch {
    // file may already be gone
  }
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

export async function streamFile(urlType, filename, res, options = {}) {
  const { inline = false, downloadName } = options;
  const dir = urlType === 'assignments' ? ASSIGNMENTS_DIR : SUBMISSIONS_DIR;
  const safeName = path.basename(filename);
  const filePath = path.join(dir, safeName);
  if (!fsSync.existsSync(filePath)) {
    return false;
  }

  const contentType = mimeTypeFor(filePath);
  const outputName = downloadName || safeName;
  res.setHeader('Content-Type', contentType);

  if (inline) {
    res.setHeader('Content-Disposition', `inline; filename="${outputName}"`);
    fsSync.createReadStream(filePath).pipe(res);
    return true;
  }

  res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
  fsSync.createReadStream(filePath).pipe(res);
  return true;
}

export function filenameFromUrl(url) {
  if (!url) return null;
  return url.split('/').pop();
}
