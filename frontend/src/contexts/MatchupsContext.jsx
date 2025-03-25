import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useAuth } from '@/contexts/AuthContext';

const MatchupsContext = createContext({
  matchups: [],
  isLoading: false,
  isError: false,
  refetchMatchups: () => {},
});

export const MatchupsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const {
    data: matchups = [],
    isLoading,
    isError,
    refetch: refetchMatchups,
  } = useQuery({
    queryKey: ['matchups', user?.id],
    queryFn: async () => {
      const { data } = await client.get(`${API_URLS.MATCHUPS}/${user.id}`);
      return data;
    },
    enabled: !!user && !authLoading,
  });

  const contextValue = {
    matchups,
    isLoading: authLoading || isLoading,
    isError,
    refetchMatchups,
  };

  return <MatchupsContext.Provider value={contextValue}>{children}</MatchupsContext.Provider>;
};

export const useMatchups = () => {
  const context = useContext(MatchupsContext);
  if (context === undefined) {
    throw new Error('useMatchups must be used within a MatchupsProvider');
  }
  return context;
};
