export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToDeadlineISO(dateValue) {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export function todayDateInputValue() {
  return toDateInputValue(new Date().toISOString());
}

export function addDaysToDateInput(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInputValue(d.toISOString());
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

export function statusSelectClass(status) {
  const map = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-amber-200',
    submitted: 'border-blue-200 bg-blue-50 text-blue-800 focus:border-blue-400 focus:ring-blue-200',
    reviewed: 'border-emerald-200 bg-emerald-50 text-emerald-800 focus:border-emerald-400 focus:ring-emerald-200',
    late: 'border-orange-200 bg-orange-50 text-orange-800 focus:border-orange-400 focus:ring-orange-200',
    overdue: 'border-red-200 bg-red-50 text-red-800 focus:border-red-400 focus:ring-red-200',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-800 focus:border-emerald-400 focus:ring-emerald-200',
  };
  return map[status] || 'border-slate-200 bg-white text-slate-700 focus:border-brand-500 focus:ring-brand-200';
}

export function sanitizeFilenamePart(str) {
  return (str || 'file')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'file';
}

export function getFileExtension(fileUrl) {
  if (!fileUrl) return '';
  const clean = fileUrl.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return '';
  return clean.slice(dot).toLowerCase();
}

export function buildSubmissionDownloadName(username, assignmentTitle, fileUrl) {
  const ext = getFileExtension(fileUrl) || '.zip';
  return `${sanitizeFilenamePart(username)}_${sanitizeFilenamePart(assignmentTitle)}${ext}`;
}

export function buildAssignmentPdfName(title, fileUrl) {
  const ext = getFileExtension(fileUrl) || '.pdf';
  return `${sanitizeFilenamePart(title)}${ext}`;
}

export function detectPreviewKind(fileUrl, contentType = '') {
  const ext = getFileExtension(fileUrl);
  const type = contentType.toLowerCase();

  if (type.includes('pdf') || ext === '.pdf') return 'pdf';
  if (type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (type.startsWith('text/') || ext === '.txt' || ext === '.md') return 'text';
  if (type.includes('zip') || ext === '.zip') return 'zip';
  return 'other';
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
