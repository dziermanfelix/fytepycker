import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups as useMatchupsHook } from '@/hooks/useMatchups';

const MatchupsContext = createContext();

export const MatchupsProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeFightTab, setActiveFightTab] = useState('all');

  const {
    items: matchups,
    selectedItem: selectedMatchup,
    selectItem: selectMatchup,
    clearSelectedItem: clearSelectedMatchup,
    isLoading,
    isError,
    refetch: refetchMatchups,
  } = useMatchupsHook({ userAId: user?.id });

  const fights = selectedMatchup?.event?.fights || {};
  const selections = selectedMatchup?.selections?.filter((s) => s.matchup === selectedMatchup.id) || [];
  const selectionResults = selectedMatchup?.selection_results?.filter((s) => s.matchup === selectedMatchup.id) || [];

  const contextValue = {
    activeFightTab,
    setActiveFightTab,

    user,

    matchups,
    selectedMatchup,
    selectMatchup,
    clearSelectedMatchup,
    isLoading,
    isError,
    refetchMatchups,

    fights,
    selections,
    selectionResults,
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
