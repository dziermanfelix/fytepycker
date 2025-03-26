import { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useAuth } from '@/contexts/AuthContext';

const useDataFetching = (apiEndpoint) => {
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
      const { data } = await client.get(`${apiEndpoint}`);
      return data;
    },
    enabled: !!user && !authLoading,
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

const MatchupsContext = createContext({
  matchups: [],
  selectedMatchup: null,
  fights: [],
  isLoading: false,
  isError: false,
  refetchMatchups: () => {},
  selectMatchup: () => {},
  clearSelectedMatchup: () => {},
});

export const MatchupsProvider = ({ children }) => {
  const {
    items: matchups,
    selectedItem: selectedMatchup,
    selectItem: selectMatchup,
    clearSelectedItem: clearSelectedMatchup,
    isLoading,
    isError,
    refetch: refetchMatchups,
  } = useDataFetching(API_URLS.MATCHUPS);

  const {
    data: fights = [],
    isLoading: fightsLoading,
    isError: fightsError,
    refetch: refetchFights,
  } = useQuery({
    queryKey: ['matchup-fights', selectedMatchup?.id],
    queryFn: async () => {
      if (!selectedMatchup) return [];
      const { data } = await client.get(`${API_URLS.EVENTS}${selectedMatchup.event}`);
      return data;
    },
    enabled: !!selectedMatchup,
  });

  const contextValue = {
    matchups,
    selectedMatchup,
    fights,
    isLoading,
    isError,
    refetchMatchups,
    selectMatchup,
    clearSelectedMatchup,
  };

  return <MatchupsContext.Provider value={contextValue}>{children}</MatchupsContext.Provider>;
};

export const useMatchups = () => {
  const context = useContext(MatchupsContext);
  if (context === undefined) {
    throw new Error('useMatchups must be used within a MatchupsProvider');
  }
  return context;
};

const EventsContext = createContext({
  events: [],
  selectedEvent: null,
  isLoading: false,
  isError: false,
  refetchEvents: () => {},
  selectEvent: () => {},
  clearSelectedEvent: () => {},
});

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
