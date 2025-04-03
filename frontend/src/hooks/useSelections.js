import { useMemo } from 'react';
import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useSelections = ({ matchup }) => {
  const params = useMemo(() => {
    if (matchup?.id) return { matchup_id: matchup.id };
    return null;
  }, [matchup]);

  return useDataFetching(API_URLS.SELECTIONS, !!params, params);
};
