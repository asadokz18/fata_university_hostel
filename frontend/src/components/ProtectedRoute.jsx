// Route guard: logged-out users go to /login, wrong-role users go to their own dashboard
import { Navigate } from 'react-router-dom';
import { dashboardFor, useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div className="spinner" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.user_role)) return <Navigate to={dashboardFor(user.user_role)} replace />;
  return children;
}
