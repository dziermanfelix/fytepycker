import { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchups as useMatchupsHook } from '@/hooks/useMatchups';
import { useSelections } from '@/hooks/useSelections';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

const MatchupsContext = createContext();

export const MatchupsProvider = ({ children, disableWebSockets = false }) => {
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

  // Store functions in refs to avoid dependency issues
  const refetchMatchupsRef = useRef(refetchMatchups);
  const refetchSelectionsRef = useRef(refetchSelections);
  const selectMatchupRef = useRef(selectMatchup);
  const fetchSelectedMatchupRef = useRef(fetchSelectedMatchup);

  // Update refs when functions change
  useEffect(() => {
    refetchMatchupsRef.current = refetchMatchups;
    refetchSelectionsRef.current = refetchSelections;
    selectMatchupRef.current = selectMatchup;
    fetchSelectedMatchupRef.current = fetchSelectedMatchup;
  }, [refetchMatchups, refetchSelections, selectMatchup]);

  // Create stable string of matchup IDs to use as dependency
  const matchupIdsKey = useMemo(() => {
    if (!matchups || matchups.length === 0) return '';
    return matchups
      .filter((matchup) => !matchup.event.complete)
      .map((matchup) => matchup.id)
      .sort((a, b) => a - b)
      .join(',');
  }, [matchups]);

  // Track which matchup IDs we've seen (to know which ones to keep open)
  const seenMatchupIdsRef = useRef(new Set());

  // WebSocket management - keeps sockets open for all incomplete matchups
  useEffect(() => {
    // Skip WebSocket creation if disabled (e.g., for Record page)
    if (disableWebSockets) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let host = window.location.host;
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:8001`;
    }

    // Get current incomplete matchup IDs
    const currentMatchupIds = matchupIdsKey ? new Set(matchupIdsKey.split(',').map(Number).filter(Boolean)) : new Set();

    // Add current IDs to seen set (so we remember them even if temporarily not in list)
    currentMatchupIds.forEach((id) => seenMatchupIdsRef.current.add(id));

    // Only close sockets for matchups that we've confirmed are completed/removed
    // (i.e., they were in our seen set but are no longer in current incomplete matchups)
    // AND we have matchup data loaded (not just loading)
    if (matchups && matchups.length > 0) {
      // Get all matchup IDs from loaded data (including completed ones)
      const allLoadedMatchupIds = new Set(matchups.map((m) => m.id));

      // Close sockets for matchups that are no longer in the loaded data at all
      Object.keys(socketsRef.current).forEach((matchupId) => {
        const id = Number(matchupId);
        if (!allLoadedMatchupIds.has(id)) {
          // Matchup was deleted or doesn't exist anymore
          const socket = socketsRef.current[matchupId];
          if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            console.log(`[WS cleanup] closing socket for matchup ${matchupId} (removed from data)`);
            socket.close();
          }
          delete socketsRef.current[matchupId];
          seenMatchupIdsRef.current.delete(id);
        } else if (!currentMatchupIds.has(id)) {
          // Matchup exists but is now completed - close socket
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

    // Create sockets for incomplete matchups (current or previously seen)
    const matchupsToConnect = currentMatchupIds.size > 0 ? currentMatchupIds : seenMatchupIdsRef.current; // If no current data, use seen IDs to keep sockets open

    matchupsToConnect.forEach((matchupId) => {
      // Skip if socket already exists and is connected/connecting
      if (socketsRef.current[matchupId]) {
        const socket = socketsRef.current[matchupId];
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          return; // Socket is good, skip
        }
        // Socket exists but is closed, reconnect it
        console.log(`[WS] reconnecting closed socket for matchup ${matchupId}`);
        delete socketsRef.current[matchupId];
      }

      // Create new socket
      const wsUrl = `${protocol}://${host}/ws/matchups/${matchupId}/`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => console.log(`[WS connected] matchup ${matchupId}`);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[WS ${matchupId}] event:`, data.type);

          if (data.type === 'refetch_selections') {
            refetchMatchupsRef.current();
            refetchSelectionsRef.current();
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
        // Only remove if this is still the current socket for this matchup
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
  }, [disableWebSockets, matchupIdsKey, matchups, selectedMatchup?.id]); // Include matchups to detect when they're removed

  // Cleanup on window unload (page close/refresh) - not on component unmount
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
      // Don't close sockets on component unmount - they should persist during navigation
      // The provider wrapping /dash/* should not unmount during normal navigation
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
