import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLifetime as useLifetimeHook } from '@/hooks/useLifetime';

const LifetimeContext = createContext({});

export const LifetimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeUserTab, setActiveUserTab] = useState(null);

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
