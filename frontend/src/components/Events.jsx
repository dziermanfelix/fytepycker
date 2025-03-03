import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { API_URLS } from '../common/urls';
import { useState } from 'react';

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const EventCard = ({ event }) => (
    <div
      className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
      onClick={() => setSelectedEvent(event)}
    >
      {event.url && (
        <a href={event.url} target='_blank' rel='noopener noreferrer' className='underline'>
          {event.name}
        </a>
      )}
      <p className='text-gray-600'>{new Date(event.date).toLocaleString()}</p>
      <p className='text-gray-700'>{event.location}</p>
    </div>
  );

  const FightCard = ({ card }) => (
    <div>
      {card && card.length > 0 && (
        <div>
          <p className='mt-4'>{card[0].card}</p>
          <ul className='space-y-4'>
            {card.map((fight) => (
              <li key={fight.id} className='p-4 bg-white shadow rounded border'>
                <p className='text-gray-600 text-center w-full mb-4'>{fight.weight_class}</p>
                <div className='flex items-center justify-between w-full'>
                  <img src={fight.blue_img} alt={fight.blue_name} className='w-50 h-50 object-contain' />
                  <a
                    href={fight.blue_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline font-semibold'
                  >
                    {fight.blue_name}
                  </a>
                  <span className='text-gray-600'>vs</span>
                  <a href={fight.red_url} target='_blank' rel='noopener noreferrer' className='underline font-semibold'>
                    {fight.red_name}
                  </a>
                  <img src={fight.red_img} alt={fight.red_name} className='w-50 h-50 rounded-full object-contain' />
                </div>
                {fight.winner && fight.method && fight.round && (
                  <p className='text-green-600 font-bold'>
                    Winner: {fight.winner} ({fight.method})
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

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
            className={`px-4 py-2 mr-2 ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'past' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events ({pastEvents.length})
          </button>
        </div>
      )}

      {!selectedEvent && activeTab === 'upcoming' && (
        <div className='grid gap-4'>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className='text-center text-gray-500'>No events available.</p>
          )}
        </div>
      )}

      {!selectedEvent && activeTab === 'past' && (
        <div className='grid gap-4'>
          {pastEvents.length > 0 ? (
            pastEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className='text-center text-gray-500'>No events available.</p>
          )}
        </div>
      )}

      {selectedEvent && (
        <div className='mt-2 mb-2 rounded-lg'>
          <FightCard card={selectedEvent.fights.main} />
          <FightCard card={selectedEvent.fights.prelim} />
          <FightCard card={selectedEvent.fights.early} />
          <button
            className='mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
            onClick={() => setSelectedEvent(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;
