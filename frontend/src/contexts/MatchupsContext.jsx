import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups as useMatchupsHook } from '@/hooks/useMatchups';
import { useSelections } from '@/hooks/useSelections';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

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

  const {
    items: selections,
    isLoading: isLoadingSelections,
    isError: isErrorSelections,
    refetch: refetchSelections,
  } = useSelections({ matchup: selectedMatchup });

  const fetchSelectedMatchup = async () => {
    const { data } = await client.get(`${API_URLS.MATCHUPS}?id=${selectedMatchup?.id}`);
    return data;
  };

  const ws = useRef(null);

  useEffect(() => {
    if (!selectedMatchup?.id) {
      return;
    }
    ws.current = new WebSocket(`ws://localhost:8001/ws/matchups/${selectedMatchup.id}/`);
    ws.current.onopen = () => {
      console.log('WebSocket connected for matchup', selectedMatchup.id);
    };
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'refetch_selections') {
        refetchSelections();
      } else if (data.type === 'refetch_matchup') {
        const fetchData = await fetchSelectedMatchup(selectedMatchup.id);
        const updatedMatchup = fetchData ? fetchData[0] : null;
        selectMatchup(updatedMatchup);
        await refetchMatchups();
      }
    };
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ws.current.onclose = (event) => {
      console.log(`WebSocket disconnected for matchup ${selectedMatchup.id}. Reason: ${event.reason}`);
    };
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [selectedMatchup?.id]);

  const fights = selectedMatchup?.event?.fights || {};
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
    isLoadingSelections,
    isErrorSelections,
    refetchSelections,
    selectionResults,

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
