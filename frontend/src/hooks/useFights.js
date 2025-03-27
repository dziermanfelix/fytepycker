import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useFights = ({ eventId, matchup }) => {
  let fightEventId = eventId || matchup?.event;
  return useDataFetching(`${API_URLS.EVENTS}${fightEventId}`, !!fightEventId);
};
