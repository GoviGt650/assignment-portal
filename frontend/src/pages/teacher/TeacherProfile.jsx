import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Save, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingPage, Panel } from '../../components/UI';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

export default function TeacherProfile() {
  const { user, updateSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setNewUsername(user?.username || '');
  }, [user?.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usernameChanged = newUsername.trim().toLowerCase() !== user?.username;
    const passwordChanged = !!newPassword;

    if (!usernameChanged && !passwordChanged) {
      toast.error('Change your username or enter a new password');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        current_password: currentPassword,
        ...(usernameChanged ? { new_username: newUsername.trim() } : {}),
        ...(passwordChanged ? { new_password: newPassword, confirm_password: confirmPassword } : {}),
      };

      const { data } = await authApi.updateProfile(payload);
      updateSession(data.access_token, data.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Account updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        badge="Account Settings"
        title="Profile & Security"
        subtitle="Update your teacher username and password. You will stay signed in after saving."
      />

      <Panel title="Current Account">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="mt-1 font-semibold text-slate-900">{user.username}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">{user.role}</p>
        </div>
      </Panel>

      <Panel title="Change Credentials">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="current_password" className="mb-2 block text-sm font-medium text-slate-700">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to confirm"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="new_username" className="mb-2 block text-sm font-medium text-slate-700">
              New Username
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="new_username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                minLength={3}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="new_password" className="mb-2 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {loading ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </Panel>
    </div>
  );
}
