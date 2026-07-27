import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errors.js';
import { streamFile } from '../services/storageService.js';

const router = Router();

router.get('/:type/:filename', authenticate, async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    if (!['assignments', 'submissions'].includes(type)) {
      throw new NotFoundError('File not found');
    }
    const ok = await streamFile(type, filename, res);
    if (!ok) {
      throw new NotFoundError('File not found');
    }
  } catch (err) {
    next(err);
  }
});

export default router;
