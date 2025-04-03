import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useLifetime = ({ userId }) => {
  const params = { user_id: userId };

  return useDataFetching(API_URLS.LIFETIME, !!params, params);
};
