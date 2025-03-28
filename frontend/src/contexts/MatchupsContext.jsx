import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';
import { useFights } from '@/hooks/useFights';
import { useSelections } from '@/hooks/useSelections';

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
  } = useDataFetching(API_URLS.MATCHUPS);

  const {
    items,
    isLoading: isLoadingFights,
    isError: isErrorFights,
    refetch: refetchFights,
  } = useFights({ matchup: selectedMatchup });

  const fights = items?.event?.fights || {};

  const {
    items: selections,
    isLoading: isLoadingSelections,
    isError: isErrorSelections,
    refetch: refetchSelections,
  } = useSelections({ matchup: selectedMatchup });

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
    isLoadingFights,
    isErrorFights,
    refetchFights,

    selections,
    isLoadingSelections,
    isErrorSelections,
    refetchSelections,
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
