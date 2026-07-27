import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  ExternalLink,
  Eye,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi, submissionApi, downloadFile } from '../../services/api';
import { buildSubmissionDownloadName, formatDate, formatDateOnly } from '../../utils/helpers';
import {
  DataTable,
  EmptyState,
  FilePreviewModal,
  FilterBar,
  LoadingPage,
  NoticeCard,
  SelectDropdown,
  StatusBadge,
  StatusSelect,
  UserAvatar,
} from '../../components/UI';

const inputClass =
  'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

const actionBtn =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700';

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
        message: err.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={submission.username} size="sm" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Feedback</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {submission.username} · {submission.assignment_title}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {notice && (
            <NoticeCard type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />
          )}
          <textarea
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student..."
            className={`w-full resize-y ${inputClass}`}
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [notice, setNotice] = useState(null);

  const assignmentId = searchParams.get('assignment_id') || '';
  const status = searchParams.get('status') || '';
  const isAwaitingView = status === 'awaiting';
  const isRosterView = Boolean(assignmentId) && !status && !isAwaitingView;
  const selectedAssignment = assignments.find((a) => String(a.id) === assignmentId);

  const stats = useMemo(() => {
    if (isAwaitingView) {
      return {
        total: items.length,
        overdue: items.filter((s) => s.awaiting_status === 'overdue').length,
        notSubmitted: items.filter((s) => s.awaiting_status === 'not_submitted').length,
      };
    }
    if (isRosterView) {
      return {
        total: items.length,
        submitted: items.filter((s) => s.id).length,
        notSubmitted: items.filter((s) => !s.id).length,
        reviewed: items.filter((s) => s.status === 'reviewed').length,
      };
    }
    return {
      total: items.length,
      reviewed: items.filter((s) => s.status === 'reviewed').length,
      withFeedback: items.filter((s) => s.remarks).length,
    };
  }, [items, isAwaitingView, isRosterView]);

  const hasSubmission = (item) => Boolean(item?.id);

  useEffect(() => {
    assignmentApi.list({ limit: 100 })
      .then(({ data }) => setAssignments(data.items))
      .catch(() => {});
  }, []);

  const handleAssignmentFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('assignment_id', value);
    else next.delete('assignment_id');
    setSearchParams(next);
  };

  const handleStatusFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || status || assignmentId);

  const load = () => {
    setLoading(true);
    const params = {
      search,
      assignment_id: assignmentId || undefined,
      limit: 100,
    };

    const request = isAwaitingView
      ? submissionApi.listAwaiting(params)
      : submissionApi.list({
        ...params,
        status: status || undefined,
      });

    request
      .then(({ data }) => setItems(data.items))
      .catch((err) => setNotice({
        type: 'error',
        title: isAwaitingView ? 'Could not load awaiting students' : 'Could not load submissions',
        message: err.message,
      }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, status, assignmentId, isAwaitingView]);

  const updateStatus = async (id, newStatus) => {
    setNotice(null);
    try {
      await submissionApi.updateStatus(id, { status: newStatus });
      setNotice({ type: 'success', title: 'Status updated', message: 'Submission status saved.' });
      load();
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not update status', message: err.message });
    }
  };

  const handleDownload = async (submission) => {
    setNotice(null);
    try {
      const filename = buildSubmissionDownloadName(
        submission.username,
        submission.assignment_title,
        submission.uploaded_file
      );
      await downloadFile(submission.uploaded_file, filename);
      setNotice({ type: 'success', title: 'Download started', message: `Saving as ${filename}` });
    } catch {
      setNotice({ type: 'error', title: 'Download failed', message: 'Could not download the file.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Review"
        title="Submissions"
        subtitle={
          isAwaitingView
            ? selectedAssignment
              ? `Students who have not submitted "${selectedAssignment.title}".`
              : 'Students who have not submitted yet. Pick an assignment to narrow the list.'
            : selectedAssignment
              ? `All students for "${selectedAssignment.title}" — submitted and not submitted.`
              : 'Review, download, and leave feedback on student work.'
        }
      />

      {notice && (
        <NoticeCard type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />
      )}

      <FilterBar>
        <SelectDropdown
          value={assignmentId}
          onChange={(e) => handleAssignmentFilter(e.target.value)}
          className="w-full sm:min-w-[260px] sm:w-auto"
          placeholder="Filter by assignment"
          options={[
            { value: '', label: 'All assignments' },
            ...assignments.map((a) => ({
              value: String(a.id),
              label: `${a.title} · ${a.submission_count || 0}/${a.student_count || 0} submitted · ${a.awaiting_count || 0} awaiting`,
            })),
          ]}
        />
        <div className="relative w-full flex-1 sm:min-w-[240px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600" />
          <input
            type="search"
            placeholder="Search student or assignment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 ${inputClass}`}
          />
        </div>
        <SelectDropdown
          value={status}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[200px]"
          placeholder="All submissions"
          options={[
            { value: '', label: assignmentId ? 'All students' : 'All submissions' },
            { value: 'awaiting', label: 'Awaiting submission' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'late', label: 'Late' },
          ]}
        />
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto">
            Clear filters
          </button>
        )}
      </FilterBar>

      {!loading && items.length > 0 && (
        <p className="text-sm text-slate-500">
          {isAwaitingView ? (
            <>
              <span className="font-semibold text-slate-700">{stats.total}</span> awaiting
              {' · '}
              <span className="font-semibold text-slate-700">{stats.notSubmitted}</span> before deadline
              {' · '}
              <span className="font-semibold text-slate-700">{stats.overdue}</span> overdue
            </>
          ) : isRosterView ? (
            <>
              <span className="font-semibold text-slate-700">{stats.total}</span> students
              {' · '}
              <span className="font-semibold text-slate-700">{stats.submitted}</span> submitted
              {' · '}
              <span className="font-semibold text-slate-700">{stats.notSubmitted}</span> not submitted
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-700">{stats.total}</span> submissions
              {' · '}
              <span className="font-semibold text-slate-700">{stats.reviewed}</span> reviewed
              {' · '}
              <span className="font-semibold text-slate-700">{stats.withFeedback}</span> with feedback
            </>
          )}
        </p>
      )}

      {loading ? (
        <LoadingPage />
      ) : items.length === 0 ? (
        <EmptyState
          title={isAwaitingView ? 'No students awaiting submission' : 'No submissions found'}
          description={
            isAwaitingView
              ? assignmentId
                ? 'Every student has submitted for this assignment.'
                : 'Pick an assignment filter or publish a new assignment for students to complete.'
              : hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'Submissions appear here when students submit work.'
          }
        />
      ) : isAwaitingView ? (
        <DataTable columns={['Student', 'Assignment', 'Due date', 'Status']}>
          {items.map((item) => (
            <tr key={`${item.student_id}-${item.assignment_id}`} className="transition hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={item.username} size="sm" />
                  <span className="font-medium text-slate-900">{item.username}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{item.assignment_title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                {formatDateOnly(item.assignment_deadline)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.awaiting_status} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <DataTable columns={['Student', 'Assignment', 'Submitted', 'Status', 'Feedback', 'Actions']}>
          {items.map((s) => (
            <tr key={s.id ?? `${s.student_id}-${s.assignment_id}`} className="transition hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={s.username} size="sm" />
                  <span className="font-medium text-slate-900">{s.username}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{s.assignment_title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                {s.submitted_at ? formatDate(s.submitted_at) : '—'}
              </td>
              <td className="px-4 py-3">
                {hasSubmission(s) ? (
                  <StatusSelect
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                  />
                ) : (
                  <StatusBadge status={s.status} />
                )}
              </td>
              <td className="max-w-[180px] px-4 py-3">
                {s.remarks ? (
                  <p className="truncate text-sm text-slate-600" title={s.remarks}>{s.remarks}</p>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {hasSubmission(s) ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFeedbackTarget(s)}
                      title={s.remarks ? 'Edit feedback' : 'Add feedback'}
                      className={actionBtn}
                    >
                      <MessageSquare size={15} />
                    </button>
                    {s.uploaded_file && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewTarget(s)}
                          title="Preview submission"
                          className={actionBtn}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(s)}
                          title="Download file"
                          className={actionBtn}
                        >
                          <Download size={15} />
                        </button>
                      </>
                    )}
                    {s.github_url && (
                      <a
                        href={s.github_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open GitHub"
                        className={actionBtn}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No submission yet</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {previewTarget && (
        <FilePreviewModal
          url={previewTarget.uploaded_file}
          title={`${previewTarget.username}'s submission`}
          subtitle={previewTarget.assignment_title}
          downloadName={buildSubmissionDownloadName(
            previewTarget.username,
            previewTarget.assignment_title,
            previewTarget.uploaded_file
          )}
          onClose={() => setPreviewTarget(null)}
        />
      )}

      {feedbackTarget && (
        <FeedbackModal
          submission={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSaved={() => {
            setNotice({ type: 'success', title: 'Feedback saved', message: 'The student can now see your feedback.' });
            load();
          }}
        />
      )}
    </div>
  );
}
