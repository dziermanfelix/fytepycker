import { createContext, useContext } from 'react';
import { useFights } from '@/hooks/useFights';
import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

const MatchupsContext = createContext();

export const MatchupsProvider = ({ children }) => {
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
    items: fights,
    isLoading: isLoadingFights,
    isError: isErrorFights,
    refetch: refetchFights,
  } = useFights({ matchup: selectedMatchup });

  const contextValue = {
    matchups,
    selectedMatchup,
    isLoading,
    isError,
    refetchMatchups,
    selectMatchup,
    clearSelectedMatchup,

    fights,
    refetchFights,
    isLoadingFights,
    isErrorFights,
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
