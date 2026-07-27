import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { ValidationError } from './errors.js';

const tempDir = path.join(config.storage.uploadDir, 'temp');
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const maxBytes = config.storage.maxFileSizeMb * 1024 * 1024;

function fileFilter(allowedTypes) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.zip', '.txt', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.png', '.jpg', '.jpeg', '.py', '.java', '.cpp', '.c', '.md'];
    if (allowedTypes === 'pdf' && (file.mimetype === 'application/pdf' || ext === '.pdf')) {
      return cb(null, true);
    }
    if (allowedTypes === 'submission') {
      const ok = ext === '.zip' || allowedExts.includes(ext) || file.mimetype.includes('zip');
      if (ok) return cb(null, true);
    }
    cb(new ValidationError(`File type not allowed: ${file.originalname}`));
  };
}

export const uploadPdf = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: fileFilter('pdf'),
}).single('pdf');

export const uploadSubmission = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: fileFilter('submission'),
}).single('file');

export const uploadSubmissionFiles = multer({
  storage,
  limits: { fileSize: maxBytes, files: 20 },
  fileFilter: fileFilter('submission'),
}).array('files', 20);
