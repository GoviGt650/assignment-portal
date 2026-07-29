import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, BookOpen, Lock, Mail } from 'lucide-react';
import AuthBrandPanel from '../components/AuthBrandPanel';
import OtpInput, { PasswordStrength } from '../components/OtpInput';
import OtpResendControl, { DevOtpNotice } from '../components/OtpResendControl';
import { authApi } from '../services/api';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error('Enter your registered email');
      return;
    }
    setSendingOtp(true);
    try {
      const { data } = await authApi.sendForgotPasswordOtp(email.trim());
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent || otp.length !== 6) {
      toast.error('Send and enter the 6-digit code first');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({
        email: email.trim(),
        otp,
        new_password: password,
        confirm_password: confirm,
      });
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel
        badge="Account recovery"
        headline="Reset your password."
        highlight="Verify with email OTP."
        description="Students can reset a forgotten password using the email linked to their account."
        features={[
          'Secure one-time code',
          'Works with your registered email',
          'Sign in immediately after reset',
        ]}
        footer="Teachers — contact admin for account help"
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
            <p className="mt-2 text-sm text-slate-500">
              Enter the email on your student account. We will send a verification code.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <DevOtpNotice visible={devMode} />

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Registered email
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
                      setDevMode(false);
                      setOtp('');
                    }}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <OtpResendControl
                onSend={handleSendOtp}
                sending={sendingOtp}
                sent={otpSent}
                cooldown={cooldown}
                disabled={!email.trim()}
                idleLabel="Send reset code"
                sentLabel="Resend reset code"
              />

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Verification code</label>
                <OtpInput value={otp} onChange={setOtp} disabled={!otpSent} />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
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
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? 'Resetting...' : (
                  <>
                    Reset password
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

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
