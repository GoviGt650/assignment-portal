import { useRef } from 'react';

export default function OtpInput({ value, onChange, disabled = false }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  const updateAt = (index, char) => {
    if (!/^\d?$/.test(char)) return;
    const next = digits.map((d, i) => (i === index ? char : d.trim())).join('').slice(0, 6);
    onChange(next.replace(/\s/g, ''));
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => updateAt(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="h-12 w-full max-w-[52px] rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 sm:h-14 sm:max-w-[56px] sm:text-xl"
        />
      ))}
    </div>
  );
}

function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-400' };
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-400' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
}

export function PasswordStrength({ password }) {
  const strength = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition ${
              level <= strength.score ? strength.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">Password strength: <span className="font-medium text-slate-700">{strength.label}</span></p>
    </div>
  );
}
