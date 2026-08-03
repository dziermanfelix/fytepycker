import { createContext, useContext, useState, useCallback } from 'react';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';
import client from '@/api/client';

const EventsContext = createContext({});

export const EventsProvider = ({ children }) => {
  const {
    items: events,
    selectedItem: selectedEvent,
    selectItem,
    isLoading,
    isError,
  } = useDataFetching(API_URLS.EVENTS);

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailError, setIsDetailError] = useState(false);

  const selectEvent = useCallback(
    async (event) => {
      if (!event) {
        selectItem(null);
        setIsDetailError(false);
        setIsLoadingDetail(false);
        return;
      }

      selectItem(event);
      if (!event.id) return;

      // Already have fight cards (e.g. re-select after detail fetch)
      if (event.fights && Object.values(event.fights).some((card) => card?.length > 0)) {
        setIsDetailError(false);
        return;
      }

      setIsLoadingDetail(true);
      setIsDetailError(false);
      try {
        const { data } = await client.get(`${API_URLS.EVENTS}${event.id}/`);
        selectItem(data.event);
      } catch {
        setIsDetailError(true);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [selectItem],
  );

  const upcomingEvents = events?.upcoming || [];
  const fights = selectedEvent?.fights || {};

  const contextValue = {
    selectedEvent,
    selectEvent,
    isLoading,
    isError,
    isLoadingDetail,
    isDetailError,
    upcomingEvents,
    fights,
  };

  return <EventsContext.Provider value={contextValue}>{children}</EventsContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
