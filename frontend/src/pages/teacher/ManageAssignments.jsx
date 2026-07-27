import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, FileText, Trash2, Upload, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import { formatDateOnly } from '../../utils/helpers';
import {
  ConfirmDialog,
  EmptyState,
  IconBox,
  LoadingPage,
  NoticeCard,
  StatCard,
} from '../../components/UI';

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => ({
    total: assignments.length,
    submissions: assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0),
    upcoming: assignments.filter((a) => new Date(a.deadline) >= new Date()).length,
  }), [assignments]);

  const load = () => {
    setLoading(true);
    assignmentApi.list({ limit: 100 })
      .then(({ data }) => setAssignments(data.items))
      .catch((err) => setNotice({
        type: 'error',
        title: 'Could not load assignments',
        message: err.message,
      }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setNotice(null);
    try {
      await assignmentApi.remove(deleteTarget.id);
      setNotice({
        type: 'success',
        title: 'Assignment deleted',
        message: `"${deleteTarget.title}" was removed successfully.`,
      });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Delete failed',
        message: err.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Assignments"
        title="Manage Assignments"
        subtitle="Review published work, track submissions, and create new assignments."
        action={
          <Link
            to="/teacher/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <Upload size={16} />
            Create assignment
          </Link>
        }
      />

      {notice && (
        <NoticeCard
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {!loading && assignments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Published" value={stats.total} icon={FileText} accent="brand" />
          <StatCard label="Total submissions" value={stats.submissions} icon={Users} accent="green" />
          <StatCard label="Still open" value={stats.upcoming} icon={Calendar} accent="amber" />
        </div>
      )}

      {loading ? (
        <LoadingPage />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Create your first assignment to start collecting student submissions."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => (
            <article
              key={a.id}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <IconBox icon={FileText} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {a.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Due date</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatDateOnly(a.deadline)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {a.submission_count || 0}/{a.student_count || 0}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link
                  to={`/teacher/submissions?assignment_id=${a.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <ClipboardList size={15} />
                  Submissions
                </Link>
                <Link
                  to={`/teacher/submissions?assignment_id=${a.id}&status=awaiting`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <Users size={15} />
                  Awaiting ({a.awaiting_count || 0})
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(a)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete assignment?"
          message={`"${deleteTarget.title}" and all related submissions will be permanently removed.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
