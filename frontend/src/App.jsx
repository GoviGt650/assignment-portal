import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssignments from './pages/student/StudentAssignments';
import AssignmentDetail from './pages/student/AssignmentDetail';
import SubmitAssignment from './pages/student/SubmitAssignment';
import SubmissionHistory from './pages/student/SubmissionHistory';
import StudentProfile from './pages/student/StudentProfile';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageAssignments from './pages/teacher/ManageAssignments';
import UploadAssignment from './pages/teacher/UploadAssignment';
import SubmissionList from './pages/teacher/SubmissionList';
import StudentList from './pages/teacher/StudentList';
import TeacherProfile from './pages/teacher/TeacherProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route path="/student" element={<ProtectedRoute role="student"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
            <Route path="assignments/:id/submit" element={<SubmitAssignment />} />
            <Route path="history" element={<SubmissionHistory />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="/teacher" element={<ProtectedRoute role="teacher"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="assignments" element={<ManageAssignments />} />
            <Route path="upload" element={<UploadAssignment />} />
            <Route path="submissions" element={<SubmissionList />} />
            <Route path="students" element={<StudentList />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
