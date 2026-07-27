import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end={to.endsWith('/teacher') || to.endsWith('/student')}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {children}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = isTeacher ? 'Teacher Portal' : 'Student Portal';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] lg:flex">
      <aside className="relative border-b border-slate-800 bg-slate-950 lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.25),_transparent_60%)]" />

        <div className="relative border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-500 p-2.5 text-white shadow-lg shadow-brand-500/30">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-bold text-white">Terralogic ASP</p>
              <p className="text-xs text-slate-300">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="relative hidden px-4 pt-4 lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-100">
              <Sparkles size={14} />
              {isTeacher ? 'Manage assignments & submissions' : 'Submit and track your work'}
            </div>
          </div>
        </div>

        <nav className="relative flex gap-2 overflow-x-auto p-4 lg:flex-1 lg:flex-col">
          {isTeacher ? (
            <>
              <NavItem to="/teacher" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem to="/teacher/assignments" icon={ClipboardList}>Assignments</NavItem>
              <NavItem to="/teacher/upload" icon={Upload}>Upload Assignment</NavItem>
              <NavItem to="/teacher/submissions" icon={ClipboardList}>Submissions</NavItem>
              <NavItem to="/teacher/students" icon={Users}>Students</NavItem>
              <NavItem to="/teacher/profile" icon={Settings}>Account Settings</NavItem>
            </>
          ) : (
            <>
              <NavItem to="/student" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem to="/student/assignments" icon={ClipboardList}>Assignments</NavItem>
              <NavItem to="/student/history" icon={History}>Submission History</NavItem>
            </>
          )}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs capitalize text-slate-400">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:pl-72">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
