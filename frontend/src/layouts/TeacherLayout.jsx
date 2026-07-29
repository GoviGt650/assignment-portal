import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/UI';

export function teacherHomePath(user) {
  if (user?.role === 'teacher' && !user?.email) {
    return '/teacher/setup-email';
  }
  if (user?.role === 'teacher') {
    return '/teacher';
  }
  return '/student';
}

export default function TeacherLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingPage />;
  if (!user || user.role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }

  const onSetupPage = location.pathname === '/teacher/setup-email';
  const needsEmail = !user.email;

  if (needsEmail && !onSetupPage) {
    return <Navigate to="/teacher/setup-email" replace />;
  }

  if (!needsEmail && onSetupPage) {
    return <Navigate to="/teacher" replace />;
  }

  return <Outlet />;
}
