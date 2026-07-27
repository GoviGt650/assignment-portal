import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Send,
  Upload,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { assignmentApi } from '../../services/api';
import {
  addDaysToDateInput,
  dateInputToDeadlineISO,
  formatDateOnly,
  todayDateInputValue,
} from '../../utils/helpers';
import { DatePickerField, NoticeCard } from '../../components/UI';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 text-brand-600 shadow-sm">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800">{label}</label>
      {children}
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChecklistItem({ done, label }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 size={16} className="shrink-0 text-brand-600" />
      ) : (
        <Circle size={16} className="shrink-0 text-slate-300" />
      )}
      <span className={done ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

export default function UploadAssignment() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const dateShortcuts = useMemo(() => [
    { label: 'In 3 days', value: addDaysToDateInput(3) },
    { label: 'In 1 week', value: addDaysToDateInput(7) },
    { label: 'In 2 weeks', value: addDaysToDateInput(14) },
  ], []);

  const checklist = useMemo(() => ({
    title: title.trim().length >= 3,
    deadline: Boolean(deadline),
    pdf: Boolean(pdf),
  }), [title, deadline, pdf]);

  const readyToPublish = checklist.title && checklist.deadline && checklist.pdf;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!pdf) {
      setNotice({
        type: 'error',
        title: 'PDF required',
        message: 'Attach the assignment PDF before publishing.',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('deadline', dateInputToDeadlineISO(deadline));
      formData.append('pdf', pdf);

      const { data: created } = await assignmentApi.create(formData);
      setNotice({
        type: 'success',
        title: 'Assignment published',
        message: `"${title.trim()}" is now live. Showing students who still need to submit...`,
      });
      setTimeout(
        () => navigate(`/teacher/submissions?assignment_id=${created.id}&status=awaiting`),
        1800,
      );
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
    <div className="space-y-6">
      <Link
        to="/teacher/assignments"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Back to assignments
      </Link>

      <PageHeader
        badge="Publish"
        title="Create Assignment"
        subtitle="Set up the details, due date, and PDF. Students will see this on their assignments page."
      />

      {notice && (
        <NoticeCard
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <SectionCard
              icon={FileText}
              title="Assignment details"
              description="Give students a clear title and brief instructions."
            >
              <Field label="Title" hint="Keep it short and specific, e.g. Week 3 — React Hooks">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title"
                  className={inputClass}
                  required
                  minLength={3}
                />
              </Field>
              <Field label="Description" hint="Optional. Include tasks, rubric notes, or links.">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="What should students deliver?"
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </SectionCard>

            <SectionCard
              icon={Calendar}
              title="Due date"
              description="Students can submit until the end of the selected day."
            >
              <DatePickerField
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={todayDateInputValue()}
                shortcuts={dateShortcuts}
              />
            </SectionCard>

            <SectionCard
              icon={Upload}
              title="Assignment PDF"
              description="Upload the handout or brief students need to complete the work."
            >
              <label className="block cursor-pointer">
                <div className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                  pdf
                    ? 'border-brand-200 bg-brand-50/40'
                    : 'border-slate-200 bg-slate-50/50 hover:border-brand-200 hover:bg-brand-50/30'
                }`}>
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                    pdf ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'border border-brand-100 bg-brand-50 text-brand-600'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    {pdf ? pdf.name : 'Drop PDF here or click to browse'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pdf
                      ? `${formatFileSize(pdf.size)} · PDF attached`
                      : 'PDF only · Max 10 MB'}
                  </p>
                  {pdf && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPdf(null);
                      }}
                      className="mt-4 text-xs font-semibold text-brand-600 underline-offset-2 hover:underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPdf(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
            </SectionCard>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                {title.trim() || 'Untitled assignment'}
              </h3>
              {description.trim() ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">{description}</p>
              ) : (
                <p className="mt-2 text-sm italic text-slate-400">No description added yet.</p>
              )}

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Due date</span>
                  <span className="text-right font-medium text-slate-900">
                    {deadline ? formatDateOnly(`${deadline}T12:00:00`) : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">PDF</span>
                  <span className="max-w-[140px] truncate font-medium text-slate-900">
                    {pdf?.name || 'Not attached'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Ready to publish</p>
              <div className="mt-4 space-y-3">
                <ChecklistItem done={checklist.title} label="Title added" />
                <ChecklistItem done={checklist.deadline} label="Due date selected" />
                <ChecklistItem done={checklist.pdf} label="PDF attached" />
              </div>

              <button
                type="submit"
                disabled={loading || !readyToPublish}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Publish assignment
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                Students can view and submit immediately after publishing.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
