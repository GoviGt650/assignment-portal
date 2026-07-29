import { AlertTriangle, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';

function pickIcon(kind) {
  if (kind === 'network') return WifiOff;
  if (kind === 'server') return ServerCrash;
  return AlertTriangle;
}

export function formatApiError(error) {
  if (!error?.response) {
    return {
      kind: 'network',
      title: 'Cannot reach the server',
      message: 'Check your WiFi connection and make sure the backend is running (cd backend && npm run dev). On mobile, use the same network as your PC.',
    };
  }

  const status = error.response.status;
  if (status === 502 || status === 503 || status === 504) {
    return {
      kind: 'server',
      title: 'Server is waking up',
      message: 'The API may be starting (common on free hosting). Wait 30–60 seconds and tap Try again.',
    };
  }

  return {
    kind: 'server',
    title: 'Something went wrong',
    message: error.response?.data?.detail || error.message || 'Please try again.',
  };
}

export default function ApiErrorState({ title, message, kind = 'server', onRetry, retryLabel = 'Try again' }) {
  const Icon = pickIcon(kind);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-2 py-8 sm:min-h-[50vh]">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon size={28} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <RefreshCw size={16} />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
