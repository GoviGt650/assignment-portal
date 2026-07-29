import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Upload, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dashboardApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useAsyncLoad } from '../../hooks/useAsyncLoad.jsx';
import { Panel, StatCard, StatusBadge } from '../../components/UI';

export default function TeacherDashboard() {
  const { renderState } = useAsyncLoad(
    () => dashboardApi.teacher().then(({ data }) => data),
    []
  );

  return renderState((data) => (
    <div className="space-y-6">
      <PageHeader
        badge="Teacher Portal"
        title="Dashboard"
        subtitle="Overview of students, assignments, submissions, and upcoming deadlines."
        action={
          <Link
            to="/teacher/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <Upload size={16} />
            Upload Assignment
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={data.total_students} icon={Users} accent="brand" to="/teacher/students" />
        <StatCard label="Assignments" value={data.total_assignments} icon={BookOpen} accent="green" to="/teacher/assignments" />
        <StatCard label="Submissions" value={data.total_submissions} icon={ClipboardList} accent="amber" to="/teacher/submissions" />
        <StatCard label="Awaiting Submission" value={data.pending_submissions} icon={Users} accent="red" to="/teacher/submissions?status=awaiting" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent Submissions"
          action={
            <Link to="/teacher/submissions" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {data.recent_submissions.map((s) => (
              <Link
                key={s.id}
                to={`/teacher/submissions?assignment_id=${s.assignment_id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-100 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.student_username}</p>
                  <p className="text-sm text-slate-500">{s.assignment_title}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={s.status} />
                  <p className="mt-1 text-xs text-slate-400">{formatDate(s.submitted_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming Deadlines">
          <div className="space-y-3">
            {data.upcoming_deadlines.map((a) => (
              <Link
                key={a.id}
                to={`/teacher/assignments`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-brand-100 hover:bg-white"
              >
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-500">{formatDate(a.deadline)}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  ));
}
