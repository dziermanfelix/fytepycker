import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLifetime as useLifetimeHook } from '@/hooks/useLifetime';

const LifetimeContext = createContext({});

export const LifetimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeUserTab, setActiveUserTab] = useState(null);
  const [selectedUser, setSelectedUser] = useState(() => {
    const savedSelectedUser = sessionStorage.getItem('selectedUser');
    return savedSelectedUser ? JSON.parse(savedSelectedUser) : null;
  });

  useEffect(() => {
    if (selectedUser) {
      sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    } else {
      sessionStorage.removeItem('selectedUser');
    }
  }, [selectedUser]);

  const { items, isLoading, isError, refetch } = useLifetimeHook({ userId: user?.id });

  const contextValue = {
    user,

    items,
    selectedUser,
    setSelectedUser,

    activeUserTab,
    setActiveUserTab,

    isLoading,
    isError,
    refetch,
  };

  return <LifetimeContext.Provider value={contextValue}>{children}</LifetimeContext.Provider>;
};

export const useLifetime = () => {
  const context = useContext(LifetimeContext);
  if (context === undefined) {
    throw new Error('useLifetime must be used within an LifetimeProvider');
  }
  return context;
};
