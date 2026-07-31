import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import useDataFetching from '@/hooks/useDataFetching';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

export const useRecord = ({ userId }) => {
  const params = useMemo(() => (userId ? { user_id: userId } : null), [userId]);
  return useDataFetching(API_URLS.RECORD, !!params, params);
};

export const useRecordDetail = ({ userId, opponentId }) => {
  const { user, loading: authLoading } = useAuth();
  const enabled = !!user && !authLoading && !!userId && !!opponentId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [API_URLS.RECORD, userId, opponentId],
    queryFn: async () => {
      const { data } = await client.get(API_URLS.RECORD, {
        params: { user_id: userId, opponent_id: opponentId },
      });
      return data;
    },
    enabled,
  });

  return {
    detail: data,
    isLoading: enabled && isLoading,
    isError,
    refetch,
  };
};
