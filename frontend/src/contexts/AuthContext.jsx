import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await client.get('/auth/user/');
      setUser(res.data);
      return res.data;
    } catch (err) {
      setUser(null);
      localStorage.removeItem('token');
      return null;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (credentials) => {
    const res = await client.post('/auth/login/', credentials);
    localStorage.setItem('token', res.data.access);
    await fetchUser();
    return res.data;
  };

  const register = async (userData) => {
    const res = await client.post('/auth/register/', userData);
    localStorage.setItem('token', res.data.access);
    await fetchUser();
    return res.data;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout/');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchUser();
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        login,
        register,
        logout,
        fetchUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
