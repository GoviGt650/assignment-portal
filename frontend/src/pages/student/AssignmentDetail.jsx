import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileText,
  MessageSquare,
  RefreshCw,
  Upload,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi, downloadFile } from '../../services/api';
import {
  buildAssignmentPdfName,
  computeStudentStatus,
  formatDate,
  formatDateOnly,
  isPastDeadline,
} from '../../utils/helpers';
import { FilePreviewModal, IconBox, LoadingPage, NoticeCard, Panel, StatusBadge } from '../../components/UI';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const loadAssignment = () => {
    setLoading(true);
    assignmentApi.get(id)
      .then(({ data }) => setAssignment(data))
      .catch((err) => setNotice({ type: 'error', title: 'Could not load assignment', message: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(loadAssignment, [id]);

  const handleDownloadPdf = async () => {
    setNotice(null);
    try {
      const filename = buildAssignmentPdfName(assignment.title, assignment.pdf_url);
      await downloadFile(assignment.pdf_url, filename);
      setNotice({ type: 'success', title: 'Download started', message: `Saving as ${filename}` });
    } catch {
      setNotice({ type: 'error', title: 'Download failed', message: 'Could not download the PDF.' });
    }
  };

  if (loading) return <LoadingPage />;
  if (!assignment) return null;

  const pdfDownloadName = buildAssignmentPdfName(assignment.title, assignment.pdf_url);
  const submission = assignment.my_submission;
  const studentStatus = assignment.student_status ?? computeStudentStatus(assignment, submission);
  const canSubmit = !isPastDeadline(assignment.deadline);
  const hasSubmission = ['submitted', 'late', 'reviewed'].includes(studentStatus);

  return (
    <div className="space-y-6">
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Back to assignments
      </Link>

      {notice && (
        <NoticeCard type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />
      )}

      <PageHeader
        title={assignment.title}
        subtitle={`Due ${formatDateOnly(assignment.deadline)}`}
        badge={<StatusBadge status={studentStatus} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Panel>
            <div className="flex items-start gap-3">
              <IconBox icon={FileText} />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Instructions</h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-700">
                  {assignment.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </Panel>

          {submission && (
            <Panel title="Your submission">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">Submitted {formatDate(submission.submitted_at)}</p>
                <StatusBadge status={studentStatus} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {submission.github_url && (
                  <a
                    href={submission.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ExternalLink size={14} className="text-brand-600" />
                    GitHub repository
                  </a>
                )}
                {submission.uploaded_file && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                    <Upload size={14} />
                    File attached
                  </span>
                )}
              </div>
              {submission.remarks && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    <MessageSquare size={12} />
                    Teacher feedback
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{submission.remarks}</p>
                </div>
              )}
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick info</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-brand-600" />
                <span className="text-slate-600">Due {formatDateOnly(assignment.deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={studentStatus} />
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
              {assignment.pdf_url && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPdfPreview(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
                  >
                    <Eye size={16} />
                    Preview PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <Download size={16} className="text-brand-600" />
                    Download PDF
                  </button>
                </>
              )}
              {canSubmit && (
                <Link
                  to={`/student/assignments/${id}/submit`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
                >
                  {hasSubmission ? (
                    <>
                      <RefreshCw size={16} />
                      Update submission
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit work
                    </>
                  )}
                </Link>
              )}
              {!canSubmit && !hasSubmission && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">
                  Deadline has passed
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showPdfPreview && assignment.pdf_url && (
        <FilePreviewModal
          url={assignment.pdf_url}
          title={assignment.title}
          subtitle="Assignment PDF"
          downloadName={pdfDownloadName}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </div>
  );
}
