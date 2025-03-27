import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useSelections = ({ matchup, matchupId }) => {
  let selectionMatchupId = matchupId || matchup?.id;
  return useDataFetching(API_URLS.SELECTION, !!selectionMatchupId, { matchup: selectionMatchupId });
};
