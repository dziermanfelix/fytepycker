import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URLS } from '@/common/urls';
import useDataFetching from '@/hooks/useDataFetching';
import { useMatchups } from '@/hooks/useMatchups';

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
  const fights = selectedEvent?.fights || {};

  const {
    items: matchups,
    isLoading: isLoadingMatchups,
    isError: isErrorMatchups,
    refetch: refetchMatchups,
  } = useMatchups({ userAId: user?.id, userBId: user?.id });

  const matchup = matchups.filter((m) => m?.event?.id === selectedEvent?.id)[0] || [];
  const selections = matchup?.selections?.filter((s) => s.matchup === matchup.id) || [];
  const selectionResults = matchup?.selection_results?.filter((s) => s.matchup === matchup.id) || [];

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

    matchups,
    isLoadingMatchups,
    isErrorMatchups,
    refetchMatchups,

    upcomingEvents,
    pastEvents,

    fights,
    selections,
    selectionResults,
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
