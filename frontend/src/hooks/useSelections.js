import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

export const useSelections = ({ matchup }) => {
  const { user, loading: authLoading } = useAuth();
  const matchupId = matchup?.id;
  const params = useMemo(() => (matchupId ? { matchup_id: matchupId } : null), [matchupId]);
  const cachedSelections = matchup?.selections;

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [API_URLS.SELECTIONS, user?.id, params],
    queryFn: async () => {
      const { data } = await client.get(API_URLS.SELECTIONS, { params });
      return data;
    },
    enabled: !!user && !authLoading && !!params,
    placeholderData: cachedSelections,
  });

  return {
    items: data,
    selectedItem: null,
    selectItem: () => {},
    clearSelectedItem: () => {},
    isLoading: authLoading || (isLoading && !cachedSelections?.length),
    isError,
    refetch,
  };
};
