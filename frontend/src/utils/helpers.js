export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function isPastDeadline(deadline) {
  return new Date(deadline) < new Date();
}

export const STATUS_LABELS = {
  pending: 'Pending',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  late: 'Late',
  overdue: 'Overdue',
  completed: 'Submitted',
};

export function computeStudentStatus(assignment, submission) {
  if (!submission) {
    return isPastDeadline(assignment.deadline) ? 'overdue' : 'pending';
  }
  if (submission.status === 'reviewed') return 'reviewed';
  if (submission.status === 'late') return 'late';
  if (new Date(submission.submitted_at) > new Date(assignment.deadline)) return 'late';
  return 'submitted';
}

export function statusColor(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-800 ring-amber-200',
    submitted: 'bg-blue-100 text-blue-800 ring-blue-200',
    reviewed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    late: 'bg-orange-100 text-orange-800 ring-orange-200',
    overdue: 'bg-red-100 text-red-800 ring-red-200',
    completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 ring-slate-200';
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
