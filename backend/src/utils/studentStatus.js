/**
 * Unified student-facing assignment status.
 * pending  → not submitted, deadline not passed
 * overdue  → not submitted, deadline passed
 * submitted → submitted on time
 * late     → submitted after deadline
 * reviewed → teacher marked as reviewed
 */
export function computeStudentStatus(assignment, submission) {
  if (!submission) {
    return new Date(assignment.deadline) < new Date() ? 'overdue' : 'pending';
  }

  if (submission.status === 'reviewed') return 'reviewed';
  if (submission.status === 'late') return 'late';

  const submittedAt = new Date(submission.submitted_at);
  const deadline = new Date(assignment.deadline);

  if (submittedAt > deadline) return 'late';
  if (submission.status === 'submitted') return 'submitted';

  return 'submitted';
}

export function matchesStatusFilter(studentStatus, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'active') return ['pending', 'submitted', 'late', 'reviewed'].includes(studentStatus);
  if (filter === 'pending') return studentStatus === 'pending';
  if (filter === 'completed') return ['submitted', 'late', 'reviewed'].includes(studentStatus);
  if (filter === 'overdue') return studentStatus === 'overdue';
  return true;
}
