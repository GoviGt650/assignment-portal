import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadSubmission, uploadSubmissionFiles } from '../middleware/upload.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errors.js';
import { saveFile, saveFromPath, deleteFile, filenameFromUrl } from '../services/storageService.js';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const router = Router();

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
  }
}

function isValidGithubUrl(url) {
  if (!url) return true;
  return /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(url);
}

async function getAssignmentOrThrow(id) {
  const result = await query('SELECT * FROM assignments WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Assignment not found');
  }
  return result.rows[0];
}

function computeStatus(assignment, submittedAt) {
  if (new Date(submittedAt) > new Date(assignment.deadline)) return 'late';
  return 'submitted';
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search = '', status, assignment_id, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.user.role === 'student') {
      conditions.push(`s.student_id = $${idx++}`);
      params.push(req.user.sub);
    }
    if (search) {
      conditions.push(`(u.username ILIKE $${idx} OR a.title ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conditions.push(`s.status = $${idx++}`);
      params.push(status);
    }
    if (assignment_id) {
      conditions.push(`s.assignment_id = $${idx++}`);
      params.push(parseInt(assignment_id, 10));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN assignments a ON a.id = s.assignment_id ${where}`,
      params
    );

    const result = await query(
      `SELECT s.*, u.username, a.title AS assignment_title, a.deadline AS assignment_deadline
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN assignments a ON a.id = s.assignment_id
       ${where}
       ORDER BY s.submitted_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, a.title AS assignment_title, a.deadline AS assignment_deadline
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user.sub]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, u.username, a.title AS assignment_title, a.deadline AS assignment_deadline
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Submission not found');
    }
    const submission = result.rows[0];
    if (req.user.role === 'student' && submission.student_id !== req.user.sub) {
      throw new ForbiddenError('Cannot view other students submissions');
    }
    res.json(submission);
  } catch (err) {
    next(err);
  }
});

async function handleSubmit(req, res, next) {
  try {
    validate(req);
    const assignmentId = req.params.assignmentId || req.body.assignment_id;
    const assignment = await getAssignmentOrThrow(assignmentId);

    if (new Date() > new Date(assignment.deadline)) {
      throw new ValidationError('Deadline has passed');
    }

    const { github_url } = req.body;
    if (!isValidGithubUrl(github_url)) {
      throw new ValidationError('Invalid GitHub repository URL');
    }

    let uploadedFile = null;
    if (req.file) {
      const saved = await saveFile('submission', req.file);
      uploadedFile = saved.url;
    } else if (req.files?.length) {
      const zipName = `submission-${req.user.sub}-${assignmentId}-${Date.now()}.zip`;
      const zipPath = path.join(config.storage.uploadDir, 'temp', zipName);
      await fs.promises.mkdir(path.dirname(zipPath), { recursive: true });
      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        for (const f of req.files) {
          archive.file(f.path, { name: f.originalname });
        }
        archive.finalize();
      });
      for (const f of req.files) {
        try { fs.unlinkSync(f.path); } catch { /* ignore */ }
      }
      const saved = await saveFromPath('submission', zipPath, zipName, 'application/zip');
      uploadedFile = saved.url;
    }

    if (!uploadedFile && !github_url) {
      throw new ValidationError('Upload a file or provide a GitHub URL');
    }

    const existing = await query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, req.user.sub]
    );

    const status = computeStatus(assignment, new Date().toISOString());

    if (existing.rows.length > 0) {
      const old = existing.rows[0];
      if (old.uploaded_file && uploadedFile) {
        await deleteFile('submission', filenameFromUrl(old.uploaded_file));
      }
      const result = await query(
        `UPDATE submissions SET github_url = $1, uploaded_file = COALESCE($2, uploaded_file),
         submitted_at = NOW(), status = $3 WHERE id = $4 RETURNING *`,
        [github_url || null, uploadedFile, status, old.id]
      );
      return res.json(result.rows[0]);
    }

    const result = await query(
      `INSERT INTO submissions (assignment_id, student_id, github_url, uploaded_file, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assignmentId, req.user.sub, github_url || null, uploadedFile, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

router.post(
  '/assignment/:assignmentId',
  authenticate,
  requireRole('student'),
  uploadSubmission,
  [body('github_url').optional().trim()],
  handleSubmit
);

router.post(
  '/assignment/:assignmentId/files',
  authenticate,
  requireRole('student'),
  uploadSubmissionFiles,
  [body('github_url').optional().trim()],
  handleSubmit
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('teacher'),
  [
    body('status').isIn(['pending', 'submitted', 'reviewed', 'late']).withMessage('Invalid status'),
    body('remarks').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      validate(req);
      const { status, remarks } = req.body;
      const result = await query(
        `UPDATE submissions SET status = $1, remarks = COALESCE($2, remarks) WHERE id = $3 RETURNING *`,
        [status, remarks ?? null, req.params.id]
      );
      if (result.rows.length === 0) {
        throw new NotFoundError('Submission not found');
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/feedback',
  authenticate,
  requireRole('teacher'),
  [body('feedback').optional().trim()],
  async (req, res, next) => {
    try {
      validate(req);
      const feedback = req.body.feedback?.trim() || null;
      const result = await query(
        `UPDATE submissions
         SET remarks = $1,
             status = CASE
               WHEN $2 IS NOT NULL AND status IN ('submitted', 'late') THEN 'reviewed'
               ELSE status
             END
         WHERE id = $3 RETURNING *`,
        [feedback, feedback, req.params.id]
      );
      if (result.rows.length === 0) {
        throw new NotFoundError('Submission not found');
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/export/all', authenticate, requireRole('teacher'), async (req, res, next) => {
  try {
    const { assignment_id } = req.query;
    let sql = `SELECT s.*, u.username, a.title AS assignment_title FROM submissions s
               JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id`;
    const params = [];
    if (assignment_id) {
      sql += ' WHERE s.assignment_id = $1';
      params.push(parseInt(assignment_id, 10));
    }
    sql += ' ORDER BY a.title, u.username';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
