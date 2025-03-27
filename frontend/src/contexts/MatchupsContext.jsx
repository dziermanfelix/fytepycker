import { createContext, useContext } from 'react';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';
import { useFights } from '@/hooks/useFights';
import { useSelections } from '@/hooks/useSelections';

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

  const {
    items: selections,
    isLoading: isLoadingSelections,
    isError: isErrorSelections,
    refetch: refetchSelections,
  } = useSelections({ matchup: selectedMatchup });

  const contextValue = {
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
