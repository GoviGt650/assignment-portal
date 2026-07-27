import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import { FilePicker, NoticeCard, Panel } from '../../components/UI';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

export default function UploadAssignment() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!pdf) {
      setNotice({
        type: 'error',
        title: 'PDF required',
        message: 'Please select an assignment PDF before publishing.',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('deadline', new Date(deadline).toISOString());
      formData.append('pdf', pdf);

      await assignmentApi.create(formData);
      setNotice({
        type: 'success',
        title: 'Assignment published',
        message: `"${title}" is now live for students. Redirecting to assignments...`,
      });
      setTimeout(() => navigate('/teacher/assignments'), 1800);
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Upload failed',
        message: err.message || 'Could not publish the assignment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        badge="Publish"
        title="Upload Assignment"
        subtitle="Publish a new assignment with PDF and deadline for your students."
      />

      {notice && (
        <NoticeCard
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <Panel>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <FilePicker
            label="Assignment PDF"
            hint="PDF only · Max 10 MB"
            accept="application/pdf,.pdf"
            fileName={pdf?.name}
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </form>
      </Panel>
    </div>
  );
}
