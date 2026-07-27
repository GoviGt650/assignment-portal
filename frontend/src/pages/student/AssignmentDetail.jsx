import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, ExternalLink, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi, downloadFile } from '../../services/api';
import { computeStudentStatus, formatDate, isPastDeadline } from '../../utils/helpers';
import { LoadingPage, Panel, StatusBadge } from '../../components/UI';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAssignment = () => {
    setLoading(true);
    assignmentApi.get(id)
      .then(({ data }) => setAssignment(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAssignment, [id]);

  const handleDownloadPdf = async () => {
    try {
      const filename = assignment.pdf_url.split('/').pop();
      await downloadFile(assignment.pdf_url, filename);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) return <LoadingPage />;
  if (!assignment) return null;

  const submission = assignment.my_submission;
  const studentStatus = assignment.student_status ?? computeStudentStatus(assignment, submission);
  const canSubmit = !isPastDeadline(assignment.deadline);
  const hasSubmission = ['submitted', 'late', 'reviewed'].includes(studentStatus);

  return (
    <div className="space-y-6">
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Back to assignments
      </Link>

      <PageHeader
        title={assignment.title}
        subtitle={`Due ${formatDate(assignment.deadline)}`}
        badge={<StatusBadge status={studentStatus} />}
      />

      <Panel title="Description">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
          {assignment.description || 'No description provided.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {assignment.pdf_url && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
            >
              <Download size={16} />
              Download PDF
            </button>
          )}
          {canSubmit && (
            <Link
              to={`/student/assignments/${id}/submit`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
            >
              {hasSubmission ? (
                <>
                  <RefreshCw size={16} />
                  Update Submission
                </>
              ) : (
                'Submit Assignment'
              )}
            </Link>
          )}
        </div>
      </Panel>

      {submission && (
        <Panel title="Your Submission">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Submitted {formatDate(submission.submitted_at)}</p>
            <StatusBadge status={studentStatus} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {submission.github_url && (
              <a
                href={submission.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
              >
                <ExternalLink size={14} />
                GitHub Repository
              </a>
            )}
            {submission.uploaded_file && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">File attached</span>
            )}
          </div>
          {submission.remarks && (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teacher feedback</p>
              <p className="mt-1 text-sm text-slate-700">{submission.remarks}</p>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
