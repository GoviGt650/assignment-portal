import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/UI';
import { teacherHomePath } from '../layouts/TeacherLayout';

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={teacherHomePath(user)} replace />;
  }
  return children;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user) {
    return <Navigate to={teacherHomePath(user)} replace />;
  }
  return children;
}
