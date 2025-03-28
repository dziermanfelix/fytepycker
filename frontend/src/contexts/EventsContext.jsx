import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';
import { useFights } from '@/hooks/useFights';
import { useSelections } from '@/hooks/useSelections';

const EventsContext = createContext({});

export const EventsProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeEventTab, setActiveEventTab] = useState('upcoming');
  const [activeFightTab, setActiveFightTab] = useState('all');

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
    items: fightItems,
    isLoading: isLoadingFights,
    isError: isErrorFights,
    refetch: refetchFights,
  } = useFights({ eventId: selectedEvent?.id });

  const {
    items: selections,
    isLoading: isLoadingSelections,
    isError: isErrorSelections,
    refetch: refetchSelections,
  } = useSelections({ eventId: selectedEvent?.id, userId: user?.id });

  const fights = fightItems?.event?.fights || [];

  const contextValue = {
    activeEventTab,
    setActiveEventTab,
    activeFightTab,
    setActiveFightTab,

    user,

    events,
    selectedEvent,
    selectEvent,
    clearSelectedEvent,
    isLoading,
    isError,
    refetchEvents,

    upcomingEvents,
    pastEvents,

    fights,
    isLoadingFights,
    isErrorFights,
    refetchFights,

    selections,
    isLoadingSelections,
    isErrorSelections,
    refetchSelections,
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
