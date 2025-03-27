import { createContext, useContext, useState } from 'react';
import { useFights } from '@/hooks/useFights';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';

const EventsContext = createContext({});

export const EventsProvider = ({ children }) => {
  const [activeEventTab, setActiveEventTab] = useState('upcoming');
  const [activeFightTab, setActiveFightTab] = useState('all');
  const [matchupId, setMatchupId] = useState(null);

  const {
    items: events,
    selectedItem: selectedEvent,
    selectItem: selectEvent,
    clearSelectedItem: clearSelectedEvent,
    isLoading,
    isError,
    refetch: refetchEvents,
  } = useDataFetching(API_URLS.EVENTS);

  const upcomingEvents = events.upcoming || [];
  const pastEvents = events.past || [];

  const {
    items,
    isLoading: isLoadingFights,
    isError: isErrorFights,
    refetch: refetchFights,
  } = useFights({ eventId: selectedEvent?.id });

  const fights = items?.event?.fights || [];

  const contextValue = {
    activeEventTab,
    setActiveEventTab,
    activeFightTab,
    setActiveFightTab,
    matchupId,
    setMatchupId,
    events,
    selectedEvent,
    isLoading,
    isError,
    refetchEvents,
    selectEvent,
    clearSelectedEvent,
    upcomingEvents,
    pastEvents,

    fights,
    refetchFights,
    isLoadingFights,
    isErrorFights,
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
