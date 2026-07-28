import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { authApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { DataTable, EmptyState, LoadingPage } from '../../components/UI';

const inputClass =
  'w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      authApi.getStudents({ search, limit: 100 })
        .then(({ data }) => setStudents(data.items))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Students"
        title="Student Directory"
        subtitle="Search and view all registered students."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      {loading ? (
        <LoadingPage />
      ) : students.length === 0 ? (
        <EmptyState title="No students found" description="Students will appear here after they register." />
      ) : (
        <DataTable columns={['Username', 'Email', 'Registered']}>
          {students.map((s) => (
            <tr key={s.id} className="transition hover:bg-slate-50/80">
              <td className="px-6 py-4 font-medium text-slate-900">{s.username}</td>
              <td className="px-6 py-4 text-slate-600">{s.email || '—'}</td>
              <td className="px-6 py-4 text-slate-600">{formatDate(s.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
