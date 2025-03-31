import { useMemo } from 'react';
import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useMatchups = ({ userAId, userBId }) => {
  const params = useMemo(() => {
    if (userAId && userBId) return { user_a_id: userAId, user_b_id: userBId };
    if (userAId?.id) return { user_a_id: userAId };
    return null;
  }, [userAId, userBId]);

  return useDataFetching(API_URLS.MATCHUPS, !!params, params);
};
