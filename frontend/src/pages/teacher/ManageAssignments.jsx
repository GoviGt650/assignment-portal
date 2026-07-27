import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Upload } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { ConfirmDialog, DataTable, EmptyState, LoadingPage, NoticeCard } from '../../components/UI';

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        subtitle="Edit, review, or remove published assignments."
        action={
          <Link
            to="/teacher/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <Upload size={16} />
            Upload New
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

      {loading ? (
        <LoadingPage />
      ) : assignments.length === 0 ? (
        <EmptyState title="No assignments yet" description="Upload your first assignment to get started." />
      ) : (
        <DataTable columns={['Title', 'Deadline', 'Submissions', 'Actions']}>
          {assignments.map((a) => (
            <tr key={a.id} className="transition hover:bg-slate-50/80">
              <td className="px-6 py-4">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="mt-1 line-clamp-1 text-slate-500">{a.description}</p>
              </td>
              <td className="px-6 py-4 text-slate-600">{formatDate(a.deadline)}</td>
              <td className="px-6 py-4 text-slate-600">{a.submission_count || 0}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Link to={`/teacher/submissions?assignment_id=${a.id}`} className="font-semibold text-brand-600 hover:underline">
                    View submissions
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(a)}
                    className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
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
