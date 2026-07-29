import { Mail, RefreshCw } from 'lucide-react';

const COOLDOWN_SECONDS = 60;

export default function OtpResendControl({
  onSend,
  sending = false,
  sent = false,
  cooldown = 0,
  disabled = false,
  idleLabel = 'Send verification code',
  sentLabel = 'Resend verification code',
}) {
  const progress = cooldown > 0 ? ((COOLDOWN_SECONDS - cooldown) / COOLDOWN_SECONDS) * 100 : 100;
  const waiting = cooldown > 0;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || sending || waiting}
        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-brand-200 bg-white py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {waiting && (
          <span
            className="absolute inset-y-0 left-0 bg-brand-100/80 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
        <span className="relative inline-flex items-center gap-2">
          {sending ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Sending code...
            </>
          ) : waiting ? (
            <>
              <RefreshCw size={16} />
              Resend in {cooldown}s
            </>
          ) : (
            <>
              <Mail size={16} />
              {sent ? sentLabel : idleLabel}
            </>
          )}
        </span>
      </button>
      {waiting && (
        <p className="text-center text-xs text-slate-500">
          You can request another code when the timer finishes
        </p>
      )}
    </div>
  );
}

export function DevOtpNotice({ visible }) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Email not configured</p>
      <p className="mt-1 leading-relaxed text-amber-800">
        Verification codes are not sent by email until SMTP is configured on the server.
      </p>
    </div>
  );
}
