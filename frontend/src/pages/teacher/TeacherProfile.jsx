import { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  KeyRound,
  Shield,
  User,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import { LoadingPage, NoticeCard } from '../../components/UI';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

const sections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Account details and identity' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password and sign-in' },
];

function roleLabel(role) {
  if (role === 'teacher') return 'Instructor';
  if (role === 'student') return 'Student';
  return role;
}

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
  const initial = user.username?.charAt(0)?.toUpperCase() || 'T';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="relative h-28 border-b border-slate-200/70 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_45%,#eef2f7_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(203,213,225,0.35),transparent_50%)]" />
      </div>
      <div className="relative px-6 pb-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/20">
              {initial}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
              <p className="mt-1 text-sm text-slate-500">Terralogic ASP · {roleLabel(user.role)}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
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

export default function TeacherProfile() {
  const { user, updateSession } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [notice, setNotice] = useState(null);

  const [editingUsername, setEditingUsername] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [currentPasswordProfile, setCurrentPasswordProfile] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const [currentPasswordSecurity, setCurrentPasswordSecurity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setNewUsername(user?.username || '');
  }, [user?.username]);

  const resetProfileEdit = () => {
    setEditingUsername(false);
    setCurrentPasswordProfile('');
    setNewUsername(user?.username || '');
  };

  const resetPasswordEdit = () => {
    setEditingPassword(false);
    setCurrentPasswordSecurity('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUsernameSave = async () => {
    setNotice(null);
    const usernameChanged = newUsername.trim().toLowerCase() !== user?.username;

    if (!usernameChanged) {
      setNotice({ type: 'info', title: 'No changes', message: 'Your username is already set to this value.' });
      resetProfileEdit();
      return;
    }

    if (!currentPasswordProfile) {
      setNotice({ type: 'error', title: 'Password required', message: 'Enter your current password to update your username.' });
      return;
    }

    setLoadingProfile(true);
    try {
      const { data } = await authApi.updateProfile({
        current_password: currentPasswordProfile,
        new_username: newUsername.trim(),
      });
      updateSession(data.access_token, data.user);
      resetProfileEdit();
      setNotice({ type: 'success', title: 'Username updated', message: 'Your teacher username has been saved.' });
    } catch (err) {
      setNotice({ type: 'error', title: 'Could not update username', message: err.message });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    setNotice(null);

    if (!newPassword || !confirmPassword) {
      setNotice({ type: 'error', title: 'Missing fields', message: 'Enter and confirm your new password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', title: 'Passwords do not match', message: 'Make sure both password fields are identical.' });
      return;
    }

    if (!currentPasswordSecurity) {
      setNotice({ type: 'error', title: 'Password required', message: 'Enter your current password to set a new one.' });
      return;
    }

    setLoadingPassword(true);
    try {
      const { data } = await authApi.updateProfile({
        current_password: currentPasswordSecurity,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      updateSession(data.access_token, data.user);
      resetPasswordEdit();
      setNotice({ type: 'success', title: 'Password updated', message: 'Your password was changed successfully. You remain signed in.' });
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
        subtitle="Manage your teacher profile, credentials, and account security."
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
                  Update how your account appears in the portal.
                </p>
              </div>

              <SettingsRow
                label="Username"
                description="Used to sign in and shown on submissions you review."
              >
                {!editingUsername ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <span className="font-medium text-slate-900">{user.username}</span>
                    <button
                      type="button"
                      onClick={() => setEditingUsername(true)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Edit
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      minLength={3}
                      className={inputClass}
                      placeholder="New username"
                    />
                    <input
                      type="password"
                      value={currentPasswordProfile}
                      onChange={(e) => setCurrentPasswordProfile(e.target.value)}
                      className={inputClass}
                      placeholder="Current password to confirm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleUsernameSave}
                        disabled={loadingProfile}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      >
                        {loadingProfile ? 'Saving...' : 'Save username'}
                      </button>
                      <button
                        type="button"
                        onClick={resetProfileEdit}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </SettingsRow>

              <SettingsRow
                label="Access level"
                description="Permissions assigned to this account."
                last
              >
                <div className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
                  <User size={16} className="text-brand-600" />
                  <span className="text-sm font-medium text-slate-900">{roleLabel(user.role)}</span>
                </div>
              </SettingsRow>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="text-lg font-semibold text-slate-900">Security</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your account secure with a strong, unique password.
                </p>
              </div>

              <SettingsRow
                label="Password"
                description="Use at least 6 characters. You will stay signed in after updating."
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
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <input
                      type="password"
                      value={currentPasswordSecurity}
                      onChange={(e) => setCurrentPasswordSecurity(e.target.value)}
                      className={inputClass}
                      placeholder="Current password"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      className={inputClass}
                      placeholder="New password"
                    />
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
                  <p className="mt-1 text-xs text-emerald-700">Your session stays active after profile updates.</p>
                </div>
              </SettingsRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
