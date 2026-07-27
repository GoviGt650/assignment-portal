import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi, submissionApi } from '../../services/api';
import { formatDate, isPastDeadline } from '../../utils/helpers';
import { FilePicker, FilterTabs, LoadingPage, NoticeCard, Panel } from '../../components/UI';

export default function SubmitAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [mode, setMode] = useState('file');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    assignmentApi.get(id)
      .then(({ data }) => {
        setAssignment(data);
        setGithubUrl(data.my_submission?.github_url || '');
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (isPastDeadline(assignment.deadline)) {
      setNotice({
        type: 'error',
        title: 'Deadline passed',
        message: 'This assignment is no longer accepting submissions.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (githubUrl) formData.append('github_url', githubUrl);

      if (mode === 'file' && file) {
        formData.append('file', file);
        await submissionApi.submit(id, formData);
      } else if (mode === 'folder' && folderFiles.length) {
        folderFiles.forEach((f) => formData.append('files', f));
        await submissionApi.submitFiles(id, formData);
      } else if (githubUrl) {
        await submissionApi.submit(id, formData);
      } else {
        throw new Error('Upload a file or provide a GitHub URL');
      }

      setNotice({
        type: 'success',
        title: 'Submission received',
        message: 'Your work was saved successfully. Redirecting to the assignment page...',
      });
      setTimeout(() => navigate(`/student/assignments/${id}`), 1800);
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Submission failed',
        message: err.message || 'Could not save your submission. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingPage />;

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <NoticeCard type="error" title="Could not load assignment" message={loadError} />
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={`/student/assignments/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Back to assignment
      </Link>

      <PageHeader
        badge="Submit Work"
        title={assignment.title}
        subtitle={`Deadline: ${formatDate(assignment.deadline)}`}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">GitHub Repository URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Upload Method</p>
            <FilterTabs
              tabs={[
                { key: 'file', label: 'ZIP / File' },
                { key: 'folder', label: 'Folder' },
              ]}
              active={mode}
              onChange={setMode}
            />
          </div>

          {mode === 'file' ? (
            <FilePicker
              label="Upload ZIP or file"
              hint="Max 200 MB"
              fileName={file?.name}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          ) : (
            <div className="space-y-2">
              <FilePicker
                label="Upload folder"
                hint="All files will be zipped automatically"
                directory
                fileName={folderFiles.length ? `${folderFiles.length} files selected` : null}
                onChange={(e) => setFolderFiles(Array.from(e.target.files || []))}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      </Panel>
    </div>
  );
}
