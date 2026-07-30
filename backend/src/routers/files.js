import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errors.js';
import { streamFile } from '../services/storageService.js';

const router = Router();

router.get('/:type/:filename', authenticate, async (req, res, next) => {
  const { type, filename } = req.params;
  const userId = req.user?.sub;

  try {
    if (!['assignments', 'submissions'].includes(type)) {
      console.warn(`[files] invalid type="${type}" user=${userId}`);
      throw new NotFoundError('File not found');
    }

    const safeName = filename.split('/').pop();
    console.log(`[files] stream ${type}/${safeName} user=${userId}`);

    const ok = await streamFile(type, safeName, res, { inline: true });
    if (!ok) {
      console.warn(`[files] not found ${type}/${safeName} user=${userId}`);
      throw new NotFoundError('File not found');
    }

    console.log(`[files] sent ${type}/${safeName} user=${userId}`);
  } catch (err) {
    if (!res.headersSent) {
      console.error(`[files] failed ${type}/${filename} user=${userId}:`, err.message);
    }
    next(err);
  }
});

export default router;
