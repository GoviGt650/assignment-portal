import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, ExternalLink, MessageSquare, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { submissionApi, downloadFile } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { DataTable, EmptyState, LoadingPage, NoticeCard, StatusBadge } from '../../components/UI';

const inputClass =
  'rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

function FeedbackModal({ submission, onClose, onSaved }) {
  const [feedback, setFeedback] = useState(submission.remarks || '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleSave = async () => {
    setNotice(null);
    setSaving(true);
    try {
      await submissionApi.updateFeedback(submission.id, feedback.trim());
      onSaved();
      onClose();
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Could not save feedback',
        message: err.message || 'Please check you are logged in as a teacher and try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Add feedback</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {submission.username} · {submission.assignment_title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {notice && (
            <NoticeCard
              type={notice.type}
              title={notice.title}
              message={notice.message}
              onDismiss={() => setNotice(null)}
            />
          )}
          <textarea
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student (optional)..."
            className={`w-full resize-y ${inputClass}`}
          />
          <p className="text-xs text-slate-500">
            The student will see this on their submission history and assignment page.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionList() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [notice, setNotice] = useState(null);

  const assignmentId = searchParams.get('assignment_id') || '';

  const load = () => {
    setLoading(true);
    submissionApi.list({
      search,
      status: status || undefined,
      assignment_id: assignmentId || undefined,
      limit: 100,
    })
      .then(({ data }) => setItems(data.items))
      .catch((err) => setNotice({
        type: 'error',
        title: 'Could not load submissions',
        message: err.message,
      }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, status, assignmentId]);

  const updateStatus = async (id, newStatus) => {
    setNotice(null);
    try {
      await submissionApi.updateStatus(id, { status: newStatus });
      setNotice({
        type: 'success',
        title: 'Status updated',
        message: 'The submission status was saved successfully.',
      });
      load();
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Could not update status',
        message: err.message,
      });
    }
  };

  const handleDownload = async (url) => {
    setNotice(null);
    try {
      const filename = url.split('/').pop();
      await downloadFile(url, filename);
      setNotice({
        type: 'success',
        title: 'Download started',
        message: 'The submission file is downloading to your device.',
      });
    } catch {
      setNotice({
        type: 'error',
        title: 'Download failed',
        message: 'Could not download the file. Please try again.',
      });
    }
  };

  const handleFeedbackSaved = () => {
    setNotice({
      type: 'success',
      title: 'Feedback saved',
      message: 'The student can now see your feedback on their submission.',
    });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Review"
        title="Submissions"
        subtitle="Search, review, and download student submissions."
      />

      {notice && (
        <NoticeCard
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search by username or assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`min-w-[240px] flex-1 ${inputClass}`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="late">Late</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <LoadingPage />
      ) : items.length === 0 ? (
        <EmptyState title="No submissions found" description="Try adjusting your search filters." />
      ) : (
        <DataTable columns={['Student', 'Assignment', 'Submitted', 'Status', 'Feedback', 'Actions']}>
          {items.map((s) => (
            <tr key={s.id} className="transition hover:bg-slate-50/80">
              <td className="px-6 py-4 font-medium text-slate-900">{s.username}</td>
              <td className="px-6 py-4 text-slate-600">{s.assignment_title}</td>
              <td className="px-6 py-4 text-slate-600">{formatDate(s.submitted_at)}</td>
              <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
              <td className="px-6 py-4">
                {s.remarks ? (
                  <p className="max-w-[200px] truncate text-sm text-slate-600" title={s.remarks}>
                    {s.remarks}
                  </p>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackTarget(s)}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                  >
                    <MessageSquare size={14} />
                    {s.remarks ? 'Edit feedback' : 'Add feedback'}
                  </button>
                  {s.github_url && (
                    <a href={s.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                      <ExternalLink size={14} /> GitHub
                    </a>
                  )}
                  {s.uploaded_file && (
                    <button type="button" onClick={() => handleDownload(s.uploaded_file)} className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                      <Download size={14} /> File
                    </button>
                  )}
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="late">Late</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {feedbackTarget && (
        <FeedbackModal
          submission={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSaved={handleFeedbackSaved}
        />
      )}
    </div>
  );
}
