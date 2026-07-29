import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, BookOpen, KeyRound, Lock, Mail, User } from 'lucide-react';
import AuthBrandPanel from '../components/AuthBrandPanel';
import AuthStepIndicator, { MaskedEmailBadge } from '../components/AuthStepIndicator';
import OtpInput, { PasswordStrength } from '../components/OtpInput';
import OtpResendControl, { DevOtpNotice } from '../components/OtpResendControl';
import { authApi } from '../services/api';
import { maskEmail } from '../utils/maskEmail';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

const steps = [
  { id: 1, title: 'Find account', icon: User },
  { id: 2, title: 'Verify code', icon: Mail },
  { id: 3, title: 'New password', icon: Lock },
];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const payload = () => (mode === 'email'
    ? { email: identifier.trim() }
    : { username: identifier.trim().toLowerCase() });

  const resetFlow = () => {
    setOtp('');
    setOtpSent(false);
    setDevMode(false);
    setMaskedEmail('');
  };

  const handleStep1Continue = async () => {
    if (!identifier.trim()) {
      toast.error(mode === 'email' ? 'Enter your registered email' : 'Enter your username');
      return;
    }
    setLookupLoading(true);
    resetFlow();
    try {
      const lookup = await authApi.lookupForgotPassword(payload());
      if (lookup.data.found && lookup.data.masked_email) {
        setMaskedEmail(lookup.data.masked_email);
      }

      const { data } = await authApi.sendForgotPasswordOtp(payload());
      setDevMode(Boolean(data.dev_mode));
      if (data.found && data.email) {
        setMaskedEmail(data.masked_email || maskEmail(data.email));
        setOtpSent(true);
        setCooldown(60);
        setStep(2);
        toast.success(data.message);
      } else {
        toast.success(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const { data } = await authApi.sendForgotPasswordOtp(payload());
      setDevMode(Boolean(data.dev_mode));
      if (data.masked_email) setMaskedEmail(data.masked_email);
      setOtpSent(true);
      setCooldown(60);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleStep2Continue = () => {
    if (!otpSent || otp.length !== 6) {
      toast.error('Enter the 6-digit verification code');
      return;
    }
    setStep(3);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({
        ...payload(),
        otp,
        new_password: password,
        confirm_password: confirm,
      });
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes('code')) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const stepCopy = {
    1: 'Enter your registered email or username to find your account.',
    2: 'Enter the verification code we sent to your email.',
    3: 'Choose a new password for your account.',
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel
        badge="Account recovery"
        headline="Reset your password."
        highlight="One step at a time."
        description="Find your account, verify with email OTP, then set a new password."
        features={['Email or username lookup', 'Masked email for privacy', 'Secure OTP verification']}
        footer="Students and teachers with a registered email can reset here"
      />

      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Academy ASP</p>
                <p className="text-xs text-slate-500">Password reset</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Forgot password</h2>
            <p className="mt-2 text-sm text-slate-500">{stepCopy[step]}</p>

            <AuthStepIndicator steps={steps} currentStep={step} />

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  {['email', 'username'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setMode(value); setIdentifier(''); resetFlow(); }}
                      className={`rounded-lg py-2.5 text-sm font-semibold capitalize transition ${
                        mode === value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">
                    {mode === 'email' ? 'Registered email' : 'Username'}
                  </label>
                  <div className="relative">
                    {mode === 'email' ? (
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    ) : (
                      <User className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    )}
                    <input
                      id="identifier"
                      type={mode === 'email' ? 'email' : 'text'}
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); resetFlow(); }}
                      placeholder={mode === 'email' ? 'you@example.com' : 'Your username'}
                      autoComplete={mode === 'email' ? 'email' : 'username'}
                      className={fieldClass}
                    />
                  </div>
                  {mode === 'username' && (
                    <p className="mt-2 text-xs text-slate-500">
                      We will look up your registered email and show a masked version before sending the code.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={lookupLoading || !identifier.trim()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {lookupLoading ? 'Finding account...' : (
                    <>
                      Continue
                      <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <DevOtpNotice visible={devMode} />
                <MaskedEmailBadge maskedEmail={maskedEmail} />

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">6-digit verification code</label>
                  <OtpInput value={otp} onChange={setOtp} disabled={!otpSent} />
                </div>

                <OtpResendControl
                  onSend={handleSendOtp}
                  sending={sendingOtp}
                  sent={otpSent}
                  cooldown={cooldown}
                  idleLabel="Send reset code"
                  sentLabel="Resend reset code"
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Continue}
                    disabled={!otpSent || otp.length !== 6}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    Continue
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleReset} className="space-y-5">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                  <KeyRound size={16} className="mb-1 inline" /> Code verified — set your new password.
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className={fieldClass} required />
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldClass} required />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
                    {loading ? 'Resetting...' : (
                      <>
                        Reset password
                        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
