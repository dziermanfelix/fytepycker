import { useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

const isSocketActive = (socket) =>
  socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);

const getWsHost = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  let host = window.location.host;
  if (window.location.port === '5173') {
    host = `${window.location.hostname}:8001`;
  }
  return { protocol, host };
};

export const useMatchupWebSockets = ({
  matchups,
  selectedMatchup,
  selectMatchup,
  refetchSelections,
  user,
  enabled = true,
}) => {
  const queryClient = useQueryClient();
  const socketsRef = useRef({});
  const seenMatchupIdsRef = useRef(new Set());
  const ws = useRef(null);

  const latestRef = useRef({
    selectMatchup,
    refetchSelections,
    selectedMatchup,
    user,
    queryClient,
  });

  useEffect(() => {
    latestRef.current = { selectMatchup, refetchSelections, selectedMatchup, user, queryClient };
  }, [selectMatchup, refetchSelections, selectedMatchup, user, queryClient]);

  const matchupIdsKey = useMemo(() => {
    if (!matchups || matchups.length === 0) return '';
    return matchups
      .filter((matchup) => !matchup.event.complete)
      .map((matchup) => matchup.id)
      .sort((a, b) => a - b)
      .join(',');
  }, [matchups]);

  const closeSocket = (matchupId, reason) => {
    const socket = socketsRef.current[matchupId];
    if (isSocketActive(socket)) {
      console.log(`[WS cleanup] closing socket for matchup ${matchupId} (${reason})`);
      socket.close();
    }
    delete socketsRef.current[matchupId];
    seenMatchupIdsRef.current.delete(Number(matchupId));
  };

  const handleMessage = async (matchupId, event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[WS ${matchupId}] event:`, data.type);

      const { queryClient: qc, user: currentUser, selectedMatchup: currentMatchup } = latestRef.current;

      if (data.type === 'refetch_selections') {
        qc.invalidateQueries({
          predicate: (query) => {
            const [endpoint, userId] = query.queryKey;
            return endpoint === API_URLS.MATCHUPS && userId === currentUser?.id;
          },
        });
        if (currentMatchup?.id) {
          qc.invalidateQueries({
            predicate: (query) => {
              const [endpoint, userId, params] = query.queryKey;
              return (
                endpoint === API_URLS.SELECTIONS &&
                userId === currentUser?.id &&
                params?.matchup_id === currentMatchup.id
              );
            },
          });
        }
      } else if (data.type === 'refetch_matchup') {
        const { data: fetchData } = await client.get(
          `${API_URLS.MATCHUPS}?id=${latestRef.current.selectedMatchup?.id}`,
        );
        const updatedMatchup = fetchData?.[0] ?? null;
        if (updatedMatchup) {
          latestRef.current.selectMatchup(updatedMatchup);
        }
        latestRef.current.refetchSelections();
      }
    } catch (err) {
      console.error(`[WS ${matchupId}] error parsing message:`, err);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const { protocol, host } = getWsHost();
    const currentMatchupIds = matchupIdsKey ? new Set(matchupIdsKey.split(',').map(Number).filter(Boolean)) : new Set();

    currentMatchupIds.forEach((id) => seenMatchupIdsRef.current.add(id));

    if (matchups?.length > 0) {
      const allLoadedMatchupIds = new Set(matchups.map((m) => m.id));

      Object.keys(socketsRef.current).forEach((matchupId) => {
        const id = Number(matchupId);
        if (!allLoadedMatchupIds.has(id)) {
          closeSocket(matchupId, 'removed from data');
        } else if (!currentMatchupIds.has(id)) {
          closeSocket(matchupId, 'event completed');
        }
      });
    }

    const matchupsToConnect = currentMatchupIds.size > 0 ? currentMatchupIds : seenMatchupIdsRef.current;

    matchupsToConnect.forEach((matchupId) => {
      const existing = socketsRef.current[matchupId];
      if (isSocketActive(existing)) return;
      if (existing) delete socketsRef.current[matchupId];

      const socket = new WebSocket(`${protocol}://${host}/ws/matchups/${matchupId}/`);

      socket.onopen = () => console.log(`[WS connected] matchup ${matchupId}`);
      socket.onmessage = (event) => handleMessage(matchupId, event);
      socket.onerror = (err) => console.error(`[WS error] matchup ${matchupId}`, err);
      socket.onclose = () => {
        console.log(`[WS closed] matchup ${matchupId}`);
        if (socketsRef.current[matchupId] === socket) {
          delete socketsRef.current[matchupId];
        }
      };

      socketsRef.current[matchupId] = socket;
    });

    ws.current = selectedMatchup?.id ? socketsRef.current[selectedMatchup.id] || null : null;
  }, [enabled, matchupIdsKey, matchups, selectedMatchup?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      Object.values(socketsRef.current).forEach((socket) => {
        if (isSocketActive(socket)) socket.close();
      });
      socketsRef.current = {};
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return ws;
};
