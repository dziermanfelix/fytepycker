import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLifetime as useLifetimeHook } from '@/hooks/useLifetime';

const LifetimeContext = createContext({});

export const LifetimeProvider = ({ children }) => {
  const { user } = useAuth();

  const { items, isLoading, isError, refetch } = useLifetimeHook({ userId: user?.id });

  const formattedItems = items.map((item) => ({
    opponent: item.opponent.username,
    wins: item.wins,
    losses: item.losses,
  }));

  const contextValue = {
    user,
    stats: formattedItems,

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
