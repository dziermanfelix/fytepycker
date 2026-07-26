import { createContext, useContext } from 'react';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';

const EventsContext = createContext({});

export const EventsProvider = ({ children }) => {
  const {
    items: events,
    selectedItem: selectedEvent,
    selectItem: selectEvent,
    isLoading,
    isError,
  } = useDataFetching(API_URLS.EVENTS);

  const upcomingEvents = events.upcoming || [];
  const fights = selectedEvent?.fights || {};

  const contextValue = {
    selectedEvent,
    selectEvent,
    isLoading,
    isError,
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
