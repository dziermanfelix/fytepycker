import { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups as useMatchupsHook } from '@/hooks/useMatchups';
import { useSelections } from '@/hooks/useSelections';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

const MatchupsContext = createContext();

export const MatchupsProvider = ({ children, disableWebSockets = false }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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

  const refetchMatchupsRef = useRef(refetchMatchups);
  const refetchSelectionsRef = useRef(refetchSelections);
  const selectMatchupRef = useRef(selectMatchup);
  const fetchSelectedMatchupRef = useRef(fetchSelectedMatchup);
  const queryClientRef = useRef(queryClient);
  const selectedMatchupRef = useRef(selectedMatchup);
  const userRef = useRef(user);

  useEffect(() => {
    refetchMatchupsRef.current = refetchMatchups;
    refetchSelectionsRef.current = refetchSelections;
    selectMatchupRef.current = selectMatchup;
    fetchSelectedMatchupRef.current = fetchSelectedMatchup;
    queryClientRef.current = queryClient;
    selectedMatchupRef.current = selectedMatchup;
    userRef.current = user;
  }, [refetchMatchups, refetchSelections, selectMatchup, queryClient, selectedMatchup, user]);

  const matchupIdsKey = useMemo(() => {
    if (!matchups || matchups.length === 0) return '';
    return matchups
      .filter((matchup) => !matchup.event.complete)
      .map((matchup) => matchup.id)
      .sort((a, b) => a - b)
      .join(',');
  }, [matchups]);

  const seenMatchupIdsRef = useRef(new Set());

  useEffect(() => {
    if (disableWebSockets) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let host = window.location.host;
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:8001`;
    }

    const currentMatchupIds = matchupIdsKey ? new Set(matchupIdsKey.split(',').map(Number).filter(Boolean)) : new Set();

    currentMatchupIds.forEach((id) => seenMatchupIdsRef.current.add(id));

    if (matchups && matchups.length > 0) {
      const allLoadedMatchupIds = new Set(matchups.map((m) => m.id));

      Object.keys(socketsRef.current).forEach((matchupId) => {
        const id = Number(matchupId);
        if (!allLoadedMatchupIds.has(id)) {
          const socket = socketsRef.current[matchupId];
          if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            console.log(`[WS cleanup] closing socket for matchup ${matchupId} (removed from data)`);
            socket.close();
          }
          delete socketsRef.current[matchupId];
          seenMatchupIdsRef.current.delete(id);
        } else if (!currentMatchupIds.has(id)) {
          const socket = socketsRef.current[matchupId];
          if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            console.log(`[WS cleanup] closing socket for matchup ${matchupId} (event completed)`);
            socket.close();
          }
          delete socketsRef.current[matchupId];
          seenMatchupIdsRef.current.delete(id);
        }
      });
    }

    const matchupsToConnect = currentMatchupIds.size > 0 ? currentMatchupIds : seenMatchupIdsRef.current; // If no current data, use seen IDs to keep sockets open

    matchupsToConnect.forEach((matchupId) => {
      if (socketsRef.current[matchupId]) {
        const socket = socketsRef.current[matchupId];
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          return;
        }
        console.log(`[WS] reconnecting closed socket for matchup ${matchupId}`);
        delete socketsRef.current[matchupId];
      }

      const wsUrl = `${protocol}://${host}/ws/matchups/${matchupId}/`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => console.log(`[WS connected] matchup ${matchupId}`);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[WS ${matchupId}] event:`, data.type);

          if (data.type === 'refetch_selections') {
            queryClientRef.current.invalidateQueries({
              predicate: (query) => {
                const [endpoint, userId] = query.queryKey;
                return endpoint === API_URLS.MATCHUPS && userId === userRef.current?.id;
              },
            });
            if (selectedMatchupRef.current?.id) {
              queryClientRef.current.invalidateQueries({
                predicate: (query) => {
                  const [endpoint, userId, params] = query.queryKey;
                  return (
                    endpoint === API_URLS.SELECTIONS &&
                    userId === userRef.current?.id &&
                    params?.matchup_id === selectedMatchupRef.current.id
                  );
                },
              });
            }
          } else if (data.type === 'refetch_matchup') {
            (async () => {
              const fetchData = await fetchSelectedMatchupRef.current();
              const updatedMatchup = fetchData ? fetchData[0] : null;
              if (updatedMatchup) {
                selectMatchupRef.current(updatedMatchup);
              }
              refetchSelectionsRef.current();
            })();
          }
        } catch (err) {
          console.error(`[WS ${matchupId}] error parsing message:`, err);
        }
      };

      socket.onerror = (err) => console.error(`[WS error] matchup ${matchupId}`, err);

      socket.onclose = () => {
        console.log(`[WS closed] matchup ${matchupId}`);
        if (socketsRef.current[matchupId] === socket) {
          delete socketsRef.current[matchupId];
        }
      };

      socketsRef.current[matchupId] = socket;
    });

    // Update ws.current to point to selected matchup's socket
    if (selectedMatchup?.id) {
      ws.current = socketsRef.current[selectedMatchup.id] || null;
    } else {
      ws.current = null;
    }
  }, [disableWebSockets, matchupIdsKey, matchups, selectedMatchup?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[WS cleanup] page unloading, closing all sockets...');
      Object.values(socketsRef.current).forEach((socket) => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.close();
        }
      });
      socketsRef.current = {};
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
