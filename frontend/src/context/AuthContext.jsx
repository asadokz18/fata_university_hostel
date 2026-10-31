// ============================================
// Auth context (replaces check_session / login / logout calls repeated in each page)
// ============================================
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const dashboardFor = role =>
  role === 'Admin' ? '/admin/dashboard' : role === 'Faculty' ? '/faculty/dashboard' : '/student/dashboard';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // session data or null
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.get('/auth/check-session');
    const next = data && data.logged_in ? data : null;
    setUser(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.success) await refresh();
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
