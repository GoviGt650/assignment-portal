import { STATUS_LABELS, statusColor } from '../utils/helpers';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const noticeStyles = {
  success: {
    wrap: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    message: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  error: {
    wrap: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-800',
    Icon: XCircle,
  },
  info: {
    wrap: 'border-brand-200 bg-gradient-to-br from-brand-50 to-white',
    icon: 'text-brand-600',
    title: 'text-brand-900',
    message: 'text-brand-800',
    Icon: Info,
  },
  warning: {
    wrap: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    message: 'text-amber-800',
    Icon: AlertCircle,
  },
};

export function NoticeCard({ type = 'info', title, message, onDismiss, action }) {
  const style = noticeStyles[type] || noticeStyles.info;
  const Icon = style.Icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${style.wrap}`}>
      <div className="flex gap-4">
        <div className={`mt-0.5 shrink-0 ${style.icon}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          {title && <h3 className={`font-semibold ${style.title}`}>{title}</h3>}
          {message && <p className={`mt-1 text-sm leading-relaxed ${style.message}`}>{message}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/80 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) {
  const confirmClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-brand-600 hover:bg-brand-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilePicker({ label, hint, accept, onChange, fileName, multiple, directory }) {
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/30">
        <span className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          Choose file
        </span>
        <span className="mt-3 text-sm font-medium text-slate-700">
          {fileName || 'Click to browse or drag a file here'}
        </span>
        {hint && <span className="mt-1 text-xs text-slate-500">{hint}</span>}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          {...(directory ? { webkitdirectory: '', directory: '' } : {})}
          onChange={onChange}
          className="sr-only"
        />
      </label>
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent ${className}`} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-slate-500">{description}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColor(status)}`}>
      {label}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'border-brand-100 bg-brand-50 text-brand-600',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50 text-amber-600',
    red: 'border-red-100 bg-red-50 text-red-600',
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl border p-3 shadow-sm ${accents[accent]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === tab.key
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({ columns, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ children, className = '', ...props }) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
