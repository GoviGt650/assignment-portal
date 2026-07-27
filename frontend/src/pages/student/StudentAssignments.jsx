import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { DataTable, EmptyState, FilterTabs, LoadingPage, StatusBadge } from '../../components/UI';

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
        subtitle="Download PDFs and submit your work before the deadline."
      />

      <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

      {loading ? (
        <LoadingPage />
      ) : assignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Try another filter or check back later." />
      ) : (
        <DataTable columns={['Title', 'Deadline', 'Status', 'Action']}>
          {assignments.map((a) => (
            <tr key={a.id} className="transition hover:bg-slate-50/80">
              <td className="px-6 py-4">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="mt-1 line-clamp-1 text-slate-500">{a.description}</p>
              </td>
              <td className="px-6 py-4 text-slate-600">{formatDate(a.deadline)}</td>
              <td className="px-6 py-4">
                <StatusBadge status={a.student_status || 'pending'} />
              </td>
              <td className="px-6 py-4">
                <Link
                  to={`/student/assignments/${a.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
