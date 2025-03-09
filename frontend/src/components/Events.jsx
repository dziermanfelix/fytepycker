import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { API_URLS } from '../common/urls';
import { useState } from 'react';
import EventCards from '@/components/EventCards';
import FightCards from '@/components/FightCards';

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
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
        <div className='flex border-b mb-6'>
          <button
            className={`px-4 py-2 mr-2 cursor-pointer ${
              activeEventTab === 'upcoming' ? 'border-b-2 border-blue-500 font-semibold' : ''
            }`}
            onClick={() => setActiveEventTab('upcoming')}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            className={`px-4 py-2 cursor-pointer ${
              activeEventTab === 'past' ? 'border-b-2 border-blue-500 font-semibold' : ''
            }`}
            onClick={() => setActiveEventTab('past')}
          >
            Past ({pastEvents.length})
          </button>
        </div>
      )}

      {!selectedEvent && (
        <EventCards
          setSelectedEvent={setSelectedEvent}
          events={activeEventTab === 'upcoming' ? upcomingEvents : pastEvents}
        />
      )}

      {selectedEvent && (
        <div>
          <div className='flex border-b mb-6'>
            <button
              className={`px-4 py-2 mr-2 cursor-pointer ${
                activeFightTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''
              }`}
              onClick={() => setActiveFightTab('all')}
            >
              All (
              {selectedEvent.fights?.main?.length +
                (selectedEvent.fights?.prelim?.length || 0) +
                (selectedEvent.fights?.early?.length || 0)}
              )
            </button>
            {selectedEvent.fights?.main && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'main' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('main')}
              >
                Main ({selectedEvent.fights.main.length})
              </button>
            )}
            {selectedEvent.fights?.prelim && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'prelim' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('prelim')}
              >
                Prelim ({selectedEvent.fights.prelim.length})
              </button>
            )}
            {selectedEvent.fights?.early && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'early' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('early')}
              >
                Early ({selectedEvent.fights.early.length})
              </button>
            )}
            <button
              className={`px-4 py-2 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600`}
              onClick={() => {
                setSelectedEvent(null);
                setActiveFightTab('all');
              }}
            >
              Close
            </button>
          </div>
          <div className='mt-2 mb-2 rounded-lg'>
            <FightCards selectedEvent={selectedEvent} activeEventTab={activeEventTab} activeFightTab={activeFightTab} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
