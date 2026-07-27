import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dashboardApi } from '../../services/api';
import { formatDateOnly } from '../../utils/helpers';
import { EmptyState, IconBox, LoadingPage, Panel, StatCard, StatusBadge } from '../../components/UI';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.student()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Student Portal"
        title="Dashboard"
        subtitle="Track assignments, deadlines, and submission status at a glance."
        action={
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            View assignments
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active" value={data.active_assignments} icon={Clock} accent="brand" />
        <StatCard label="Submitted" value={data.completed_assignments} icon={CheckCircle2} accent="green" />
        <StatCard label="Pending" value={data.pending_assignments} icon={BookOpen} accent="amber" />
        <StatCard label="Overdue" value={data.overdue_assignments} icon={AlertCircle} accent="red" />
      </div>

      <Panel
        title="Recent assignments"
        action={
          <Link to="/student/assignments" className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            View all
          </Link>
        }
      >
        {data.recent_assignments.length === 0 ? (
          <EmptyState title="No assignments yet" description="Check back when your teacher publishes new work." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.recent_assignments.map((a) => (
              <Link
                key={a.id}
                to={`/student/assignments/${a.id}`}
                className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <IconBox icon={BookOpen} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{a.title}</h3>
                      <StatusBadge status={a.student_status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{a.description || 'No description'}</p>
                    <p className="mt-4 text-sm font-medium text-slate-600">Due {formatDateOnly(a.deadline)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
