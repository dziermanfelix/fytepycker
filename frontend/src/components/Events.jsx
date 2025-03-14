import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { API_URLS } from '../common/urls';
import { useState } from 'react';
import EventCards from '@/components/EventCards';
import FightCards from '@/components/FightCards';
import EventTabControls from '@/components/EventTabControls';
import FightTabControls from '@/components/FightTabControls';

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [activeEventTab, setActiveEventTab] = useState('upcoming');
  const [activeFightTab, setActiveFightTab] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const upcomingEvents = data?.upcoming || [];
  const pastEvents = data?.past || [];

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-4xl mx-auto mt-8'>
      <h1 className='text-2xl font-bold text-center mb-6'>{selectedEvent ? selectedEvent?.name : 'Events'}</h1>
      {!selectedEvent && (
        <div>
          <EventTabControls
            activeEventTab={setActiveEventTab}
            setActiveEventTab={setActiveEventTab}
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
          />
          <EventCards
            setSelectedEvent={setSelectedEvent}
            setMatchup={setMatchup}
            events={activeEventTab === 'upcoming' ? upcomingEvents : pastEvents}
          />
        </div>
      )}

      {selectedEvent && (
        <div>
          <FightTabControls
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            activeFightTab={activeFightTab}
            setActiveFightTab={setActiveFightTab}
          />
          <div className='mt-2 mb-2 rounded-lg'>
            <FightCards
              selectedEvent={selectedEvent}
              activeEventTab={activeEventTab}
              activeFightTab={activeFightTab}
              matchup={matchup}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
