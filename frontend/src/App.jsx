// ============================================
// Routes (one per original HTML page)
// ============================================
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PayOnline from './pages/PayOnline';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentIdCard from './pages/StudentIdCard';
import StudentECard from './pages/StudentECard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyIdCard from './pages/FacultyIdCard';
import FacultyECard from './pages/FacultyECard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/pay-online" element={<ProtectedRoute roles={['Student', 'Faculty']}><PayOnline /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="/student/dashboard" element={<ProtectedRoute roles={['Student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/id-card" element={<ProtectedRoute roles={['Student']}><StudentIdCard /></ProtectedRoute>} />
      <Route path="/student/ecard" element={<ProtectedRoute roles={['Student']}><StudentECard /></ProtectedRoute>} />

      <Route path="/faculty/dashboard" element={<ProtectedRoute roles={['Faculty']}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/id-card" element={<ProtectedRoute roles={['Faculty']}><FacultyIdCard /></ProtectedRoute>} />
      <Route path="/faculty/ecard" element={<ProtectedRoute roles={['Faculty']}><FacultyECard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
