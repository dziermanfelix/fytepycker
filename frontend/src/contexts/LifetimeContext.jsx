import { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups } from '@/hooks/useMatchups';

const LifetimeContext = createContext({});

export const LifetimeProvider = ({ children }) => {
  const { user } = useAuth();

  const {
    items: matchups,
    isLoading: isLoadingMatchups,
    isError: isErrorMatchups,
    refetch: refetchMatchups,
  } = useMatchups({ userAId: user?.id });

  // const matchup = matchups.filter((m) => m?.event?.id === selectedEvent?.id)[0] || [];
  // const selections = matchup?.selections?.filter((s) => s.matchup === matchup.id) || [];
  // const selectionResults = matchup?.selection_results?.filter((s) => s.matchup === matchup.id) || [];

  const contextValue = {
    user,

    matchups,
    isLoadingMatchups,
    isErrorMatchups,
    refetchMatchups,

    // fights,
    // selections,
    // selectionResults,
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
