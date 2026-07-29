import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import AuthBrandPanel from '../../components/AuthBrandPanel';
import AuthStepIndicator, { SentToEmailBadge } from '../../components/AuthStepIndicator';
import OtpInput from '../../components/OtpInput';
import OtpResendControl, { DevOtpNotice } from '../../components/OtpResendControl';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

const steps = [
  { id: 1, title: 'Your email', icon: Mail },
  { id: 2, title: 'Verify code', icon: ShieldCheck },
  { id: 3, title: 'Confirm password', icon: KeyRound },
];

export default function TeacherSetupEmail() {
  const { updateSession, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();

  const validateEmailStep = () => {
    if (!normalizedEmail) {
      toast.error('Enter your email address');
      return false;
    }
    if (confirmEmail.trim().toLowerCase() !== normalizedEmail) {
      toast.error('Email addresses do not match — check both fields carefully');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateEmailStep()) return;
    setSendingOtp(true);
    try {
      const { data } = await authApi.sendSetupEmailOtp(normalizedEmail);
      setOtpSent(true);
      setDevMode(Boolean(data.dev_mode));
      setCooldown(60);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleStep1Continue = async () => {
    if (!validateEmailStep()) return;
    setSendingOtp(true);
    setOtp('');
    setOtpSent(false);
    try {
      const { data } = await authApi.sendSetupEmailOtp(normalizedEmail);
      setOtpSent(true);
      setDevMode(Boolean(data.dev_mode));
      setCooldown(60);
      setStep(2);
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

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Enter your current password to confirm');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.setupEmail({
        email: normalizedEmail,
        otp: otp.trim(),
        current_password: currentPassword,
      });
      updateSession(data.access_token, data.user);
      toast.success(data.message);
      navigate('/teacher');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel
        badge="One-time teacher setup"
        headline="Secure your account."
        highlight="Add recovery email."
        description="Link an email to change credentials safely and reset your password if you forget it."
        features={[
          'Verify with your current password',
          'Receive submission notifications',
          'Reset password anytime via email',
        ]}
        footer="Required once · Then manage everything in settings"
      />

      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Academy ASP</p>
                <p className="text-xs text-slate-500">Teacher setup</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add your email</h2>
              <p className="mt-2 text-sm text-slate-500">
                Required once before using the teacher portal. Verify with your current password.
              </p>
            </div>

            <AuthStepIndicator steps={steps} currentStep={step} />

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      name="teacher-recovery-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setOtpSent(false);
                        setDevMode(false);
                        setOtp('');
                      }}
                      placeholder="you@gmail.com"
                      autoComplete="off"
                      spellCheck={false}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-email" className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirm-email"
                      name="teacher-recovery-email-confirm"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="Re-enter the same email"
                      autoComplete="off"
                      spellCheck={false}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={sendingOtp || !normalizedEmail}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {sendingOtp ? 'Sending code...' : (
                    <>
                      {normalizedEmail && confirmEmail.trim()
                        ? `Send code to ${normalizedEmail}`
                        : 'Continue'}
                      <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <SentToEmailBadge email={normalizedEmail} />
                {!devMode && (
                  <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Check your <strong>inbox</strong> and <strong>spam/junk</strong> folder. The subject line starts with your 6-digit code.
                  </p>
                )}
                <DevOtpNotice visible={devMode} />
                <OtpResendControl
                  onSend={handleSendOtp}
                  sending={sendingOtp}
                  sent={otpSent}
                  cooldown={cooldown}
                  disabled={!normalizedEmail}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Enter 6-digit code</p>
                  <OtpInput value={otp} onChange={setOtp} disabled={!otpSent} />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                      setOtpSent(false);
                      setDevMode(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Continue}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
                  >
                    Continue
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleComplete} className="space-y-5">
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Confirm your identity with the password you used to sign in.
                </p>
                <div>
                  <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-slate-700">
                    Current password
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                      autoComplete="current-password"
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {loading ? 'Saving...' : (
                      <>
                        Complete setup
                        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center">
            <button
              type="button"
              onClick={logout}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
