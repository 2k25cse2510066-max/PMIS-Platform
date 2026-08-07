import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pmis_user');
    return raw ? JSON.parse(raw) : null;
  });

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

  const logout = useCallback(() => {
    localStorage.removeItem('pmis_token');
    localStorage.removeItem('pmis_user');
    setUser(null);
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
