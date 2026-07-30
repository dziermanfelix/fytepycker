import { useMemo } from 'react';
import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useMatchups = ({ userAId, userBId, incomplete = false } = {}) => {
  const params = useMemo(() => {
    if (!userAId && !userBId) return null;

    const next = {};
    if (userAId && userBId) {
      next.user_a_id = userAId;
      next.user_b_id = userBId;
    } else if (userAId) {
      next.user_a_id = userAId;
    }
    if (incomplete) next.incomplete = 1;
    return next;
  }, [userAId, userBId, incomplete]);

  return useDataFetching(API_URLS.MATCHUPS, !!params, params);
};
