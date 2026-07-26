import { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups as useMatchupsHook } from '@/hooks/useMatchups';
import { useSelections } from '@/hooks/useSelections';
import { useMatchupWebSockets } from '@/hooks/useMatchupWebSockets';

const MatchupsContext = createContext();

export const MatchupsProvider = ({ children, disableWebSockets = false }) => {
  const { user } = useAuth();

  const {
    items: matchups,
    selectedItem: selectedMatchup,
    selectItem: selectMatchup,
    clearSelectedItem: clearSelectedMatchup,
    isLoading,
    isError,
    refetch: refetchMatchups,
  } = useMatchupsHook({ userAId: user?.id });

  const {
    items: selections,
    isLoading: isLoadingSelections,
    isError: isErrorSelections,
    refetch: refetchSelections,
  } = useSelections({ matchup: selectedMatchup });

  const ws = useMatchupWebSockets({
    matchups,
    selectedMatchup,
    selectMatchup,
    refetchSelections,
    user,
    enabled: !disableWebSockets,
  });

  const fights = selectedMatchup?.event?.fights || {};

  const contextValue = {
    matchups,
    selectedMatchup,
    selectMatchup,
    clearSelectedMatchup,
    isLoading,
    isError,
    refetchMatchups,
    fights,
    selections,
    isLoadingSelections,
    isErrorSelections,
    refetchSelections,
    ws,
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
