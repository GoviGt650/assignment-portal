import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import AuthBrandPanel from '../components/AuthBrandPanel';
import OtpInput, { PasswordStrength } from '../components/OtpInput';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

const steps = [
  { id: 1, title: 'Verify email', icon: Mail },
  { id: 2, title: 'Create account', icon: User },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          return (
            <div key={step.id} className="flex flex-1 items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <div className="mt-2 min-w-0 sm:ml-3 sm:mt-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${active || done ? 'text-brand-700' : 'text-slate-400'}`}>
                    Step {step.id}
                  </p>
                  <p className={`truncate text-sm font-semibold ${active || done ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden h-0.5 flex-1 rounded-full sm:block ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address first');
      return;
    }
    setSendingOtp(true);
    try {
      const { data } = await authApi.sendRegisterOtp(email.trim());
      setOtpSent(true);
      setCooldown(60);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleContinue = () => {
    if (!otpSent) {
      toast.error('Send a verification code to your email first');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit verification code');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        username,
        email: email.trim(),
        password,
        otp: otp.trim(),
      });
      toast.success('Welcome! Your account is ready.');
      navigate('/student');
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes('code') || err.message.toLowerCase().includes('otp')) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel
        badge="Secure student onboarding"
        headline="Create your account."
        highlight="Verified in two easy steps."
        description="Verify your email, set up your profile, and start submitting assignments through one professional portal."
        features={[
          'Email verification with one-time code',
          'Secure assignment submissions',
          'Track deadlines and feedback',
        ]}
        footer="Free registration · Email verified · Teacher-managed portal"
      />

      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:w-1/2 lg:py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Academy ASP</p>
                <p className="text-xs text-slate-500">Student Registration</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 lg:p-10">
            <div className="mb-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h2>
              <p className="mt-2 text-sm text-slate-500">
                {step === 1
                  ? 'We will send a verification code to your email.'
                  : 'Choose a username and password to finish setup.'}
              </p>
            </div>

            <StepIndicator currentStep={step} />

            {step === 1 ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">Why we verify email</p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-800/80">
                        This keeps your account secure and lets you recover access later.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setOtpSent(false);
                        setOtp('');
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || cooldown > 0 || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : sendingOtp ? 'Sending code...' : otpSent ? 'Resend verification code' : 'Send verification code'}
                </button>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Enter 6-digit code
                  </label>
                  <OtpInput value={otp} onChange={setOtp} disabled={!otpSent} />
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    {otpSent
                      ? 'Check your inbox and spam folder. The code expires in 10 minutes.'
                      : 'Send a code first, then enter it here to continue.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!otpSent || otp.length !== 6}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                  Email verified: <span className="font-semibold">{email}</span>
                </div>

                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      placeholder="Choose a unique username"
                      autoComplete="username"
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      className={fieldClass}
                      required
                    />
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {loading ? 'Creating account...' : (
                      <>
                        Create account
                        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
