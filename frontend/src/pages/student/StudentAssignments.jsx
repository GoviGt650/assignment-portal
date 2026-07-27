import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import { formatDateOnly } from '../../utils/helpers';
import { EmptyState, FilterTabs, IconBox, LoadingPage, StatusBadge } from '../../components/UI';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === 'all' ? {} : { status: filter };
    assignmentApi.list(params)
      .then(({ data }) => setAssignments(data.items))
      .finally(() => setLoading(false));
  }, [filter]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Submitted' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Assignments"
        title="Your Assignments"
        subtitle="Open an assignment to download the PDF and submit your work before the due date."
      />

      <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

      {loading ? (
        <LoadingPage />
      ) : assignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Try another filter or check back later." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => (
            <Link
              key={a.id}
              to={`/student/assignments/${a.id}`}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <IconBox icon={BookOpen} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{a.title}</h3>
                    <StatusBadge status={a.student_status || 'pending'} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{a.description || 'No description'}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Calendar size={14} className="text-brand-600" />
                  {formatDateOnly(a.deadline)}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  Open
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
