import { CheckCircle2 } from 'lucide-react';

export default function AuthStepIndicator({ steps, currentStep }) {
  const current = steps.find((step) => step.id === currentStep) || steps[0];
  const total = steps.length;

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${((currentStep - 0.5) / total) * 100}%` }}
        />
      </div>

      {/* Step circles — compact on all screens */}
      <div className="flex items-start justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className={`flex items-start ${isLast ? '' : 'flex-1 max-w-[120px] sm:max-w-none'}`}>
              <div className="flex w-[72px] shrink-0 flex-col items-center sm:w-24">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition sm:h-10 sm:w-10 ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>
                <p
                  className={`mt-2 hidden text-center text-[11px] font-semibold leading-tight sm:block sm:text-xs ${
                    active ? 'text-brand-700' : done ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
              </div>

              {!isLast && (
                <div
                  className={`mx-0.5 mt-[18px] h-0.5 flex-1 rounded-full sm:mt-5 ${
                    done ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: current step label (avoids cramped 3-column text) */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center sm:hidden">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
          Step {currentStep} of {total}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{current.title}</p>
      </div>
    </div>
  );
}

export function MaskedEmailBadge({ maskedEmail, label = 'Code sent to' }) {
  if (!maskedEmail) return null;
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
      <p className="text-brand-700">{label}</p>
      <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-brand-900">{maskedEmail}</p>
    </div>
  );
}

export function SentToEmailBadge({ email, label = 'Code sent to' }) {
  if (!email) return null;
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
      <p className="text-brand-700">{label}</p>
      <p className="mt-1 break-all text-base font-semibold text-brand-900">{email.trim().toLowerCase()}</p>
      <p className="mt-2 text-xs text-brand-600">Wrong address? Go back and re-enter your email.</p>
    </div>
  );
}
