import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';

const useDataFetching = (apiEndpoint, enabled = true, params = {}) => {
  const { user, loading: authLoading } = useAuth();
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [apiEndpoint, user?.id],
    queryFn: async () => {
      const { data } = await client.get(apiEndpoint, { params });
      return data;
    },
    enabled: !!user && !authLoading && enabled,
  });

  const selectItem = (item) => {
    setSelectedItem(item);
  };

  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  return {
    items: data,
    selectedItem,
    selectItem,
    clearSelectedItem,
    isLoading: authLoading || isLoading,
    isError,
    refetch,
  };
};

export default useDataFetching;
