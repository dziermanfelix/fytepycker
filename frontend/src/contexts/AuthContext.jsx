import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { API_URLS } from '../common/urls';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await client.get(API_URLS.USER);
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
    const res = await client.post(API_URLS.LOGIN, credentials);
    localStorage.setItem('token', res.data.access);
    await fetchUser();
    return res.data;
  };

  const register = async (userData) => {
    const res = await client.post(API_URLS.REGISTER, userData);
    localStorage.setItem('token', res.data.access);
    await fetchUser();
    return res.data;
  };

  const logout = async () => {
    try {
      await client.post(API_URLS.LOGOUT);
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
