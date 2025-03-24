import { useState, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

const EventsContext = createContext();

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

export const EventsProvider = ({ children }) => {
  const [activeEventTab, setActiveEventTab] = useState('upcoming');
  const [activeFightTab, setActiveFightTab] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matchup, setMatchup] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const upcomingEvents = data?.upcoming || [];
  const pastEvents = data?.past || [];

  const contextValue = {
    isLoading,
    isError,
    refetchEvents: refetch,
    upcomingEvents,
    pastEvents,
    activeEventTab,
    setActiveEventTab,
    activeFightTab,
    setActiveFightTab,
    selectedEvent,
    setSelectedEvent,
    matchup,
    setMatchup,
  };

  return <EventsContext.Provider value={contextValue}>{children}</EventsContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === null) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
