import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dashboardApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { EmptyState, LoadingPage, Panel, StatCard, StatusBadge } from '../../components/UI';

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
        subtitle="Track your assignments, deadlines, and submission status in one place."
        action={
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            View Assignments
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Assignments" value={data.active_assignments} icon={Clock} accent="brand" />
        <StatCard label="Submitted" value={data.completed_assignments} icon={CheckCircle2} accent="green" />
        <StatCard label="Pending" value={data.pending_assignments} icon={AlertCircle} accent="amber" />
        <StatCard label="Overdue" value={data.overdue_assignments} icon={AlertCircle} accent="red" />
      </div>

      <Panel
        title="Recent Assignments"
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
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-brand-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{a.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description || 'No description'}</p>
                  </div>
                  <StatusBadge status={a.student_status} />
                </div>
                <p className="mt-4 text-sm text-slate-500">Due {formatDate(a.deadline)}</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
