import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errors.js';
import { saveFile, deleteFile, filenameFromUrl } from '../services/storageService.js';
import { computeStudentStatus, matchesStatusFilter } from '../utils/studentStatus.js';

const router = Router();

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
  }
}

async function attachStudentMeta(items, studentId) {
  const subResult = await query(
    'SELECT * FROM submissions WHERE student_id = $1',
    [studentId]
  );
  const subMap = Object.fromEntries(subResult.rows.map((r) => [r.assignment_id, r]));

  return items.map((a) => {
    const submission = subMap[a.id] || null;
    return {
      ...a,
      my_submission: submission,
      student_status: computeStudentStatus(a, submission),
    };
  });
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status: filterStatus } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const isTeacher = req.user.role === 'teacher';

    let whereClause = '';
    const params = [];
    if (!isTeacher) {
      whereClause = `WHERE a.deadline >= NOW() OR EXISTS (
        SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1
      )`;
      params.push(req.user.sub);
    }

    const countResult = await query(`SELECT COUNT(*) FROM assignments a ${whereClause}`, params);
    const result = await query(
      `SELECT a.*, u.username AS created_by_username,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       ${whereClause}
       ORDER BY a.deadline ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit, 10), offset]
    );

    let items = result.rows;

    if (!isTeacher) {
      items = await attachStudentMeta(items, req.user.sub);
      if (filterStatus && filterStatus !== 'all') {
        items = items.filter((a) => matchesStatusFilter(a.student_status, filterStatus));
      }
    }

    res.json({
      items,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, u.username AS created_by_username FROM assignments a
       JOIN users u ON u.id = a.created_by WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Assignment not found');
    }
    const assignment = result.rows[0];

    if (req.user.role === 'student') {
      const sub = await query(
        'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [assignment.id, req.user.sub]
      );
      assignment.my_submission = sub.rows[0] || null;
      assignment.student_status = computeStudentStatus(assignment, assignment.my_submission);
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole('teacher'),
  uploadPdf,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    body('description').optional().trim(),
    body('deadline').isISO8601().withMessage('Valid deadline is required'),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      let pdfUrl = null;
      if (req.file) {
        const saved = await saveFile('assignment', req.file);
        pdfUrl = saved.url;
      }
      const { title, description, deadline } = req.body;
      const result = await query(
        `INSERT INTO assignments (title, description, pdf_url, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, description || null, pdfUrl, deadline, req.user.sub]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requireRole('teacher'),
  uploadPdf,
  async (req, res, next) => {
    try {
      const existing = await query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
      if (existing.rows.length === 0) {
        throw new NotFoundError('Assignment not found');
      }
      if (existing.rows[0].created_by !== req.user.sub) {
        throw new ForbiddenError('You can only edit your own assignments');
      }

      let pdfUrl = existing.rows[0].pdf_url;
      if (req.file) {
        if (pdfUrl) {
          await deleteFile('assignment', filenameFromUrl(pdfUrl));
        }
        const saved = await saveFile('assignment', req.file);
        pdfUrl = saved.url;
      }

      const { title, description, deadline } = req.body;
      const result = await query(
        `UPDATE assignments SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          pdf_url = $3,
          deadline = COALESCE($4, deadline)
         WHERE id = $5 RETURNING *`,
        [title || null, description ?? null, pdfUrl, deadline || null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authenticate, requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      throw new NotFoundError('Assignment not found');
    }
    if (existing.rows[0].pdf_url) {
      await deleteFile('assignment', filenameFromUrl(existing.rows[0].pdf_url));
    }
    await query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
