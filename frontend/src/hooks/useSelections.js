import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useSelections = ({ matchup, eventId, userId }) => {
  if (eventId && userId) {
    return useDataFetching(API_URLS.SELECTION, !!eventId, { event: eventId, user: userId });
  }
  let matchupId = matchup?.id;
  return useDataFetching(API_URLS.SELECTION, !!matchupId, { matchup: matchupId });
};
