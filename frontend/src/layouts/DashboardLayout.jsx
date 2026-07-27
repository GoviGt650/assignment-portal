import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon: Icon, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to.endsWith('/teacher') || to.endsWith('/student')}
      onClick={onNavigate}
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);
  const roleLabel = isTeacher ? 'Teacher Portal' : 'Student Portal';

  const navItems = isTeacher ? (
    <>
      <NavItem to="/teacher" icon={LayoutDashboard} onNavigate={closeMenu}>Dashboard</NavItem>
      <NavItem to="/teacher/assignments" icon={ClipboardList} onNavigate={closeMenu}>Assignments</NavItem>
      <NavItem to="/teacher/upload" icon={Upload} onNavigate={closeMenu}>Upload Assignment</NavItem>
      <NavItem to="/teacher/submissions" icon={ClipboardList} onNavigate={closeMenu}>Submissions</NavItem>
      <NavItem to="/teacher/students" icon={Users} onNavigate={closeMenu}>Students</NavItem>
      <NavItem to="/teacher/profile" icon={Settings} onNavigate={closeMenu}>Account Settings</NavItem>
    </>
  ) : (
    <>
      <NavItem to="/student" icon={LayoutDashboard} onNavigate={closeMenu}>Dashboard</NavItem>
      <NavItem to="/student/assignments" icon={ClipboardList} onNavigate={closeMenu}>Assignments</NavItem>
      <NavItem to="/student/history" icon={History} onNavigate={closeMenu}>Submission History</NavItem>
    </>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.25),_transparent_60%)]" />

        <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-500 p-2.5 text-white shadow-lg shadow-brand-500/30">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-bold text-white">Terralogic ASP</p>
              <p className="text-xs text-slate-300">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="rounded-xl border border-white/15 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative hidden px-4 pt-4 lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-100">
              <Sparkles size={14} />
              {isTeacher ? 'Manage assignments & submissions' : 'Submit and track your work'}
            </div>
          </div>
        </div>

        <nav className="relative flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {navItems}
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

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-500 p-2 text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Terralogic ASP</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
