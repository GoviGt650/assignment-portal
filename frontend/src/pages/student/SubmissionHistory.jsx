import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ExternalLink, History, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { submissionApi } from '../../services/api';
import { formatDate, formatDateOnly } from '../../utils/helpers';
import { EmptyState, IconBox, LoadingPage, StatusBadge } from '../../components/UI';

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
        subtitle="Review everything you have submitted and read teacher feedback."
      />

      {history.length === 0 ? (
        <EmptyState title="No submissions yet" description="Your completed submissions will appear here." />
      ) : (
        <div className="space-y-4">
          {history.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <IconBox icon={History} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{s.assignment_title}</h3>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(s.submitted_at)}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar size={14} className="text-brand-600" />
                      Due {formatDateOnly(s.assignment_deadline)}
                    </p>
                  </div>
                </div>
              </div>

              {s.remarks && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    <MessageSquare size={12} />
                    Teacher feedback
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{s.remarks}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link
                  to={`/student/assignments/${s.assignment_id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  View assignment
                  <ArrowRight size={14} />
                </Link>
                {s.github_url && (
                  <a
                    href={s.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ExternalLink size={14} className="text-brand-600" />
                    GitHub
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
