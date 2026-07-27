import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { submissionApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { EmptyState, LoadingPage, Panel, StatusBadge } from '../../components/UI';

export default function SubmissionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionApi.history()
      .then(({ data }) => setHistory(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="History"
        title="Submission History"
        subtitle="Review all assignments you have submitted and their current status."
      />

      {history.length === 0 ? (
        <EmptyState title="No submissions yet" description="Your completed submissions will appear here." />
      ) : (
        <div className="space-y-4">
          {history.map((s) => (
            <Panel key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.assignment_title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(s.submitted_at)}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="text-slate-500">Due {formatDate(s.assignment_deadline)}</span>
                {s.github_url && (
                  <a href={s.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                    <ExternalLink size={14} />
                    GitHub
                  </a>
                )}
                <Link to={`/student/assignments/${s.assignment_id}`} className="font-semibold text-brand-600 hover:underline">
                  View assignment
                </Link>
              </div>
              {s.remarks && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Teacher feedback</p>
                  <p className="mt-1 text-sm text-slate-700">{s.remarks}</p>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
