import { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  KeyRound,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OtpInput, { PasswordStrength } from '../../components/OtpInput';
import OtpResendControl, { DevOtpNotice } from '../../components/OtpResendControl';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import { LoadingPage, NoticeCard } from '../../components/UI';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

const sections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Email and account details' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password with email verification' },
];

function SettingsNav({ active, onChange }) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition ${
              isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-600 hover:bg-brand-50'
            }`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-brand-600'}`} />
            <div>
              <p className="text-sm font-semibold">{section.label}</p>
              <p className={`mt-0.5 text-xs ${isActive ? 'text-brand-100' : 'text-slate-500'}`}>
                {section.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

function SettingsRow({ label, description, children, last = false }) {
  return (
    <div className={`flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between ${last ? '' : 'border-b border-slate-100'}`}>
      <div className="sm:max-w-sm">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      <div className="w-full sm:max-w-md">{children}</div>
    </div>
  );
}

function ProfileHero({ user }) {
  const initial = user.username?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="relative h-28 border-b border-slate-200/70 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_45%,#eef2f7_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_55%)]" />
      </div>
      <div className="relative px-6 pb-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/20">
              {initial}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
              <p className="mt-1 text-sm text-slate-500">Academy ASP · Student</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {user.email_verified ? 'Email verified' : 'Active'}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sign-in name</p>
            <p className="mt-1 font-semibold text-slate-900">@{user.username}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-700">
              <Calendar size={12} />
              Member since
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {user.created_at ? formatDate(user.created_at) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function useCooldown() {
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  return [cooldown, setCooldown];
}

export default function StudentProfile() {
  const { user, updateSession } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [notice, setNotice] = useState(null);

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailDevMode, setEmailDevMode] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailCooldown, setEmailCooldown] = useCooldown();

  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordDevMode, setPasswordDevMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [sendingPasswordOtp, setSendingPasswordOtp] = useState(false);
  const [passwordCooldown, setPasswordCooldown] = useCooldown();

  const resetEmailEdit = () => {
    setEditingEmail(false);
    setNewEmail('');
    setEmailOtp('');
    setEmailOtpSent(false);
  };

  const resetPasswordEdit = () => {
    setEditingPassword(false);
    setPasswordOtp('');
    setPasswordOtpSent(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail.trim()) {
      setNotice({ type: 'error', title: 'Email required', message: 'Enter your new email address first.' });
      return;
    }
    setSendingEmailOtp(true);
    setNotice(null);
    try {
      const { data } = await authApi.sendChangeEmailOtp(newEmail.trim());
      setEmailOtpSent(true);
      setEmailDevMode(Boolean(data.dev_mode));
      setEmailCooldown(60);
      setNotice({ type: 'success', title: 'Code sent', message: data.message });
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not send code', message: err.message });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleEmailSave = async () => {
    setNotice(null);
    if (!emailOtpSent || emailOtp.length !== 6) {
      setNotice({ type: 'error', title: 'Verification required', message: 'Send and enter the 6-digit code from your new email.' });
      return;
    }
    setLoadingEmail(true);
    try {
      const { data } = await authApi.updateEmail({ new_email: newEmail.trim(), otp: emailOtp });
      updateSession(data.access_token, data.user);
      resetEmailEdit();
      setNotice({ type: 'success', title: 'Email updated', message: data.message });
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not update email', message: err.message });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    setSendingPasswordOtp(true);
    setNotice(null);
    try {
      const { data } = await authApi.sendChangePasswordOtp();
      setPasswordOtpSent(true);
      setPasswordDevMode(Boolean(data.dev_mode));
      setPasswordCooldown(60);
      setNotice({ type: 'success', title: 'Code sent', message: data.message });
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not send code', message: err.message });
    } finally {
      setSendingPasswordOtp(false);
    }
  };

  const handlePasswordSave = async () => {
    setNotice(null);
    if (!passwordOtpSent || passwordOtp.length !== 6) {
      setNotice({ type: 'error', title: 'Verification required', message: 'Send and enter the code sent to your registered email.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', title: 'Passwords do not match', message: 'Make sure both password fields are identical.' });
      return;
    }
    setLoadingPassword(true);
    try {
      const { data } = await authApi.updatePasswordWithOtp({
        otp: passwordOtp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      updateSession(data.access_token, data.user);
      resetPasswordEdit();
      setNotice({ type: 'success', title: 'Password updated', message: data.message });
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not update password', message: err.message });
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Settings"
        title="Account Settings"
        subtitle="Manage your email, password, and account security."
      />

      {notice && (
        <NoticeCard
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <ProfileHero user={user} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-8 lg:self-start">
          <SettingsNav active={activeSection} onChange={(id) => { setActiveSection(id); setNotice(null); }} />
        </aside>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {activeSection === 'profile' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your verified email is used for security codes and account recovery.
                </p>
              </div>

              <SettingsRow
                label="Email address"
                description="We send a verification code to your new email before updating."
              >
                {!editingEmail ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail size={16} className="shrink-0 text-brand-600" />
                      <span className="truncate font-medium text-slate-900">{user.email || 'Not set'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEmail(true)}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Change
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailOtpSent(false);
                        setEmailDevMode(false);
                        setEmailOtp('');
                      }}
                      className={inputClass}
                      placeholder="New email address"
                    />
                    <DevOtpNotice visible={emailDevMode} />
                    <OtpResendControl
                      onSend={handleSendEmailOtp}
                      sending={sendingEmailOtp}
                      sent={emailOtpSent}
                      cooldown={emailCooldown}
                      disabled={!newEmail.trim()}
                    />
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-600">Enter 6-digit code</p>
                      <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={!emailOtpSent} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleEmailSave}
                        disabled={loadingEmail}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      >
                        {loadingEmail ? 'Saving...' : 'Save email'}
                      </button>
                      <button
                        type="button"
                        onClick={resetEmailEdit}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </SettingsRow>

              <SettingsRow
                label="Username"
                description="Used to sign in to the portal."
                last
              >
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <span className="font-medium text-slate-900">{user.username}</span>
                </div>
              </SettingsRow>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="text-lg font-semibold text-slate-900">Security</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Change your password using a verification code sent to your registered email.
                </p>
              </div>

              <SettingsRow
                label="Password"
                description="We email a one-time code to confirm it is really you."
              >
                {!editingPassword ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <KeyRound size={16} className="text-brand-600" />
                      <span className="text-sm tracking-widest">••••••••••••</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPassword(true)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Change
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <DevOtpNotice visible={passwordDevMode} />
                    <OtpResendControl
                      onSend={handleSendPasswordOtp}
                      sending={sendingPasswordOtp}
                      sent={passwordOtpSent}
                      cooldown={passwordCooldown}
                      idleLabel="Send code to my email"
                      sentLabel="Resend code to email"
                    />
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-600">Verification code</p>
                      <OtpInput value={passwordOtp} onChange={setPasswordOtp} disabled={!passwordOtpSent} />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      className={inputClass}
                      placeholder="New password"
                    />
                    <PasswordStrength password={newPassword} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Confirm new password"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handlePasswordSave}
                        disabled={loadingPassword}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      >
                        {loadingPassword ? 'Updating...' : 'Update password'}
                      </button>
                      <button
                        type="button"
                        onClick={resetPasswordEdit}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </SettingsRow>

              <SettingsRow
                label="Session"
                description="You are currently signed in on this device."
                last
              >
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-900">Signed in as {user.username}</p>
                  <p className="mt-1 text-xs text-emerald-700">Your session stays active after security updates.</p>
                </div>
              </SettingsRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
