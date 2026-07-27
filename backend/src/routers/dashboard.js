import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { computeStudentStatus } from '../utils/studentStatus.js';

const router = Router();

router.get('/teacher', authenticate, requireRole('teacher'), async (req, res, next) => {
  try {
    const [students, assignments, submissions, pending] = await Promise.all([
      query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
      query(`SELECT COUNT(*) FROM assignments`),
      query(`SELECT COUNT(*) FROM submissions`),
      query(
        `SELECT COUNT(*) FROM users u WHERE u.role = 'student' AND NOT EXISTS (
          SELECT 1 FROM submissions s JOIN assignments a ON a.id = s.assignment_id
          WHERE s.student_id = u.id AND a.deadline >= NOW()
        )`
      ),
    ]);

    const recentSubmissions = await query(
      `SELECT s.*, u.username, a.title AS assignment_title FROM submissions s
       JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id
       ORDER BY s.submitted_at DESC LIMIT 5`
    );

    const upcoming = await query(
      `SELECT * FROM assignments WHERE deadline >= NOW() ORDER BY deadline ASC LIMIT 5`
    );

    res.json({
      total_students: parseInt(students.rows[0].count, 10),
      total_assignments: parseInt(assignments.rows[0].count, 10),
      total_submissions: parseInt(submissions.rows[0].count, 10),
      pending_submissions: parseInt(pending.rows[0].count, 10),
      recent_submissions: recentSubmissions.rows,
      upcoming_assignments: upcoming.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/student', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = req.user.sub;

    const [active, completed, pending, overdue] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM assignments a WHERE a.deadline >= NOW()`,
        []
      ),
      query(`SELECT COUNT(*) FROM submissions WHERE student_id = $1`, [studentId]),
      query(
        `SELECT COUNT(*) FROM assignments a
         WHERE a.deadline >= NOW()
         AND NOT EXISTS (
           SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1
         )`,
        [studentId]
      ),
      query(
        `SELECT COUNT(*) FROM assignments a
         WHERE a.deadline < NOW()
         AND NOT EXISTS (
           SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1
         )`,
        [studentId]
      ),
    ]);

    const assignmentsResult = await query(
      `SELECT a.*, s.id AS submission_id, s.status AS submission_status, s.submitted_at
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
       ORDER BY a.deadline ASC LIMIT 6`,
      [studentId]
    );

    const recentAssignments = assignmentsResult.rows.map((row) => {
      const submission = row.submission_id
        ? { id: row.submission_id, status: row.submission_status, submitted_at: row.submitted_at }
        : null;
      const { submission_id, submission_status, submitted_at, ...assignment } = row;
      return {
        ...assignment,
        student_status: computeStudentStatus(assignment, submission),
      };
    });

    res.json({
      active_assignments: parseInt(active.rows[0].count, 10),
      completed_assignments: parseInt(completed.rows[0].count, 10),
      pending_assignments: parseInt(pending.rows[0].count, 10),
      overdue_assignments: parseInt(overdue.rows[0].count, 10),
      recent_assignments: recentAssignments,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
