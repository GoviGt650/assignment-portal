import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  STATUS_LABELS,
  detectPreviewKind,
  statusColor,
  statusSelectClass,
} from '../utils/helpers';
import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, FileArchive, Filter, Info, X, XCircle } from 'lucide-react';
import { downloadFile, fetchFileBlob } from '../services/api';

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

export function DatePickerField({ value, onChange, min, shortcuts = [] }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDateInput(value) : null;
  const minDate = min ? parseDateInput(min) : null;
  const initialView = selected || minDate || new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (!open) return undefined;
    const next = (value ? parseDateInput(value) : null)
      || (min ? parseDateInput(min) : null)
      || new Date();
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, value, min]);

  const selectDate = (date) => {
    if (isDateBefore(date, minDate)) return;
    onChange({ target: { value: toDateInputValue(date) } });
    setOpen(false);
  };

  const selectShortcut = (shortcutValue) => {
    onChange({ target: { value: shortcutValue } });
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const display = value
    ? selected.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Choose a due date';

  const calendarCells = buildCalendarCells(viewYear, viewMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full cursor-pointer text-left"
      >
        <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-4 transition hover:border-brand-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
            {value ? (
              <>
                <span className="text-[10px] font-semibold uppercase leading-none opacity-90">
                  {selected.toLocaleDateString(undefined, { month: 'short' })}
                </span>
                <span className="mt-0.5 text-lg font-bold leading-none">
                  {selected.getDate()}
                </span>
              </>
            ) : (
              <Calendar size={20} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Due date</p>
            <p className={`mt-1 text-sm font-semibold ${value ? 'text-slate-900' : 'text-slate-400'}`}>
              {display}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Submissions close at end of this day</p>
          </div>
          <span className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
            {value ? 'Change' : 'Select'}
          </span>
        </div>
      </button>

      {shortcuts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => selectShortcut(shortcut.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                value === shortcut.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose due date"
            className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Due date</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">Pick a day from the calendar</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close calendar"
              >
                <X size={18} />
              </button>
            </div>

            {shortcuts.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    type="button"
                    onClick={() => selectShortcut(shortcut.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      value === shortcut.value
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            )}

            <div className="px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-base font-semibold text-slate-900">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const inputValue = toDateInputValue(cell.date);
                  const isSelected = value === inputValue;
                  const isDisabled = isDateBefore(cell.date, minDate);
                  const isToday = isSameDay(cell.date, new Date());

                  return (
                    <button
                      key={`${inputValue}-${cell.inMonth ? 'in' : 'out'}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => selectDate(cell.date)}
                      className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition sm:h-10 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                          : isDisabled
                            ? 'cursor-not-allowed text-slate-300'
                            : cell.inMonth
                              ? 'text-slate-800 hover:bg-brand-50 hover:text-brand-700'
                              : 'text-slate-300 hover:bg-slate-50'
                      } ${isToday && !isSelected ? 'ring-1 ring-brand-200' : ''}`}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDateInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isDateBefore(date, minDate) {
  if (!minDate) return false;
  return startOfDay(date).getTime() < startOfDay(minDate).getTime();
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstDay.getDay();
  const cells = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = leading - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    cells.push({ date: new Date(year, month - 1, day), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - leading - daysInMonth + 1;
    cells.push({ date: new Date(year, month + 1, day), inMonth: false });
  }

  return cells;
}

export function UserAvatar({ name, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 rounded-lg text-sm',
    md: 'h-11 w-11 rounded-xl text-base',
    lg: 'h-14 w-14 rounded-2xl text-lg',
  };

  return (
    <div className={`flex shrink-0 items-center justify-center bg-brand-600 font-bold text-white shadow-sm shadow-brand-600/20 ${sizes[size]}`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export function IconBox({ icon: Icon, size = 18 }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 text-brand-600 shadow-sm">
      <Icon size={size} />
    </div>
  );
}

export function FilterBar({ title = 'Filters', children }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Filter size={16} className="text-brand-600" />
        {title}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>
    </div>
  );
}

const selectTriggerBase =
  'flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
  variant = 'default',
  size = 'md',
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxHeight = Math.min(240, window.innerHeight - rect.bottom - 16);
    setMenuStyle({
      top: maxHeight > 120 ? rect.bottom + 6 : Math.max(8, rect.top - Math.min(240, rect.top - 8) - 6),
      left: rect.left,
      width: Math.max(rect.width, 200),
      maxHeight: Math.max(120, maxHeight),
    });
  };

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    updateMenuPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (
        containerRef.current?.contains(event.target)
        || menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onScrollOrResize = () => updateMenuPosition();

    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? placeholder;
  const sizeClass = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const variantClass = variant === 'status'
    ? statusSelectClass(value)
    : 'border-slate-200 text-slate-800';

  const pick = (nextValue) => {
    onChange({ target: { value: nextValue } });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${selectTriggerBase} ${sizeClass} ${variantClass} ${triggerClassName}`}
      >
        <span className="truncate">{display}</span>
        <ChevronDown size={size === 'sm' ? 14 : 16} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            maxHeight: menuStyle.maxHeight,
            zIndex: 70,
          }}
          className="overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60"
        >
          {options.map((option) => {
            const isActive = option.value === value;
            const optionStatusClass = variant === 'status' && isActive
              ? statusSelectClass(option.value)
              : '';

            return (
              <button
                key={option.value || '__empty__'}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => pick(option.value)}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? variant === 'status'
                      ? optionStatusClass
                      : 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
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

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm sm:p-10">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
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

const STATUS_OPTIONS = ['submitted', 'reviewed', 'late', 'pending'];

export function StatusSelect({ value, onChange, className = '' }) {
  const options = STATUS_OPTIONS.map((option) => ({
    value: option,
    label: STATUS_LABELS[option] || option,
  }));

  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      options={options}
      variant="status"
      size="sm"
      className={className}
    />
  );
}

export function FilePreviewModal({ url, title, subtitle, downloadName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [contentType, setContentType] = useState('');
  const [textPreview, setTextPreview] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    fetchFileBlob(url)
      .then(async ({ blob, contentType: type }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setContentType(type);
        const kind = detectPreviewKind(url, type);
        if (kind === 'text') {
          setTextPreview(await blob.text());
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not preview file');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  const previewKind = detectPreviewKind(url, contentType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {downloadName && (
              <button
                type="button"
                onClick={() => downloadFile(url, downloadName)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download size={15} />
                Download
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-[320px] flex-1 overflow-auto bg-slate-50 p-4">
          {loading && (
            <div className="flex min-h-[280px] items-center justify-center">
              <Spinner />
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {!loading && !error && previewKind === 'pdf' && blobUrl && (
            <iframe title={title} src={blobUrl} className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" />
          )}
          {!loading && !error && previewKind === 'image' && blobUrl && (
            <div className="flex min-h-[280px] items-center justify-center">
              <img src={blobUrl} alt={title} className="max-h-[70vh] max-w-full rounded-xl border border-slate-200 bg-white object-contain" />
            </div>
          )}
          {!loading && !error && previewKind === 'text' && (
            <pre className="overflow-auto rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">{textPreview}</pre>
          )}
          {!loading && !error && (previewKind === 'zip' || previewKind === 'other') && (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="rounded-2xl bg-brand-50 p-4 text-brand-600">
                <FileArchive size={32} />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-900">
                {previewKind === 'zip' ? 'ZIP archive preview' : 'Preview not available'}
              </h4>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {previewKind === 'zip'
                  ? 'This submission is a ZIP file containing the student\'s folder or files. Download it to view everything inside.'
                  : 'This file type cannot be previewed in the browser. Download the file to open it on your device.'}
              </p>
              {downloadName && (
                <button
                  type="button"
                  onClick={() => downloadFile(url, downloadName)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Download size={16} />
                  Download file
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'brand', to }) {
  const accents = {
    brand: 'border-brand-100 bg-brand-50 text-brand-600',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50 text-amber-600',
    red: 'border-red-100 bg-red-50 text-red-600',
  };

  const className = `group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md ${
    to ? 'cursor-pointer' : ''
  }`;

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {to && (
          <p className="mt-2 text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
            View details →
          </p>
        )}
      </div>
      {Icon && (
        <div className={`rounded-xl border p-3 shadow-sm ${accents[accent]}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
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
