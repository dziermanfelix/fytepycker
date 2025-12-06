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
  const socketsRef = useRef({});

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
    if (!matchups || matchups.length === 0) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let host = window.location.host; // Includes port if non-default

    // For development (Vite dev server on port 5173, connect to Django on 8001)
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:8001`;
    }

    const currentMatchups = matchups.filter((matchup) => !matchup.event.complete);

    currentMatchups.forEach((matchup) => {
      if (socketsRef.current[matchup.id]) return;

      const wsUrl = `${protocol}://${host}/ws/matchups/${matchup.id}/`;
      const socket = new WebSocket(wsUrl);
      socket.onopen = () => console.log(`[WS connected] matchup ${matchup.id}`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`[WS ${matchup.id}] event:`, data.type);
        if (data.type === 'refetch_selections') {
          refetchMatchups();
          refetchSelections();
        } else if (data.type === 'refetch_matchup') {
          (async () => {
            const fetchData = await fetchSelectedMatchup(matchup.id);
            const updatedMatchup = fetchData ? fetchData[0] : null;
            if (updatedMatchup) {
              selectMatchup(updatedMatchup);
            }
            refetchSelections();
          })();
        }
      };
      socket.onerror = (err) => console.error(`[WS error] matchup ${matchup.id}`, err);
      socket.onclose = () => console.log(`[WS closed] matchup ${matchup.id}`);

      socketsRef.current[matchup.id] = socket;
    });

    if (!selectedMatchup?.id) {
      return;
    }
    ws.current = socketsRef.current[selectedMatchup.id];

    return () => {
      console.log('[WS cleanup] closing all sockets...');
      Object.values(socketsRef.current).forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      });
      socketsRef.current = {};
    };
  }, [matchups, selections]);

  const fights = selectedMatchup?.event?.fights || {};

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
