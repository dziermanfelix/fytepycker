import useDataFetching from '@/hooks/useDataFetching';
import { API_URLS } from '@/common/urls';

export const useRecord = ({ userId }) => {
  const params = { user_id: userId };

  return useDataFetching(API_URLS.RECORD, !!params, params);
};
