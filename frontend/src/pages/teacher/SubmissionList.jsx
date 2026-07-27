import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { submissionApi, downloadFile } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { DataTable, EmptyState, LoadingPage, StatusBadge } from '../../components/UI';

const inputClass =
  'rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

export default function SubmissionList() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const assignmentId = searchParams.get('assignment_id') || '';

  const load = () => {
    setLoading(true);
    submissionApi.list({
      search,
      status: status || undefined,
      assignment_id: assignmentId || undefined,
      limit: 100,
    })
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, status, assignmentId]);

  const updateStatus = async (id, newStatus) => {
    try {
      await submissionApi.updateStatus(id, { status: newStatus });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownload = async (url) => {
    try {
      const filename = url.split('/').pop();
      await downloadFile(url, filename);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Review"
        title="Submissions"
        subtitle="Search, review, and download student submissions."
      />

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search by username or assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`min-w-[240px] flex-1 ${inputClass}`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="late">Late</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <LoadingPage />
      ) : items.length === 0 ? (
        <EmptyState title="No submissions found" description="Try adjusting your search filters." />
      ) : (
        <DataTable columns={['Student', 'Assignment', 'Submitted', 'Status', 'Actions']}>
          {items.map((s) => (
            <tr key={s.id} className="transition hover:bg-slate-50/80">
              <td className="px-6 py-4 font-medium text-slate-900">{s.username}</td>
              <td className="px-6 py-4 text-slate-600">{s.assignment_title}</td>
              <td className="px-6 py-4 text-slate-600">{formatDate(s.submitted_at)}</td>
              <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  {s.github_url && (
                    <a href={s.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                      <ExternalLink size={14} /> GitHub
                    </a>
                  )}
                  {s.uploaded_file && (
                    <button type="button" onClick={() => handleDownload(s.uploaded_file)} className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                      <Download size={14} /> File
                    </button>
                  )}
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="late">Late</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
