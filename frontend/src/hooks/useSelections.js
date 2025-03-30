import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';
import { useMemo } from 'react';

export const useSelections = ({ matchup, eventId, userId }) => {
  const params = useMemo(() => {
    if (eventId && userId) return { event: eventId, user: userId };
    if (matchup?.id) return { matchup: matchup.id };
    return null;
  }, [matchup, eventId, userId]);

  return useDataFetching(API_URLS.SELECTIONS, !!params, params);
};
