import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pmis_user');
    return raw ? JSON.parse(raw) : null;
  });

  const navigate = useNavigate();
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('pmis_token');
    localStorage.removeItem('pmis_user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Reset the inactivity timer on any user activity
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Attach / detach activity listeners whenever user logs in or out
  useEffect(() => {
    if (!user) {
      // No active session — clear any lingering timer
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    // Start the first countdown
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pmis_token', data.token);
    localStorage.setItem('pmis_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, role, name) => {
    const { data } = await api.post('/auth/register', { email, password, role, name });
    localStorage.setItem('pmis_token', data.token);
    localStorage.setItem('pmis_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
