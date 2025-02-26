import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { API_URLS } from '../common/urls';
import { useState } from 'react';

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

const Events = () => {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-4xl mx-auto mt-10'>
      <h1 className='text-2xl font-bold text-center mb-6'>{selectedEvent ? selectedEvent?.name : 'Upcoming Events'}</h1>
      {!selectedEvent && (
        <div className='grid gap-6'>
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                onClick={() => setSelectedEvent(event)}
              >
                <h2 className='text-xl font-semibold'>{event.name}</h2>
                {event.url && (
                  <a href={event.url} target='_blank' rel='noopener noreferrer' className='text-blue-500 underline'>
                    Event Link
                  </a>
                )}
                <p className='text-gray-600'>{new Date(event.date).toLocaleString()}</p>
                <p className='text-gray-700'>{event.location}</p>
              </div>
            ))
          ) : (
            <p className='text-center text-gray-500'>No events available.</p>
          )}
        </div>
      )}

      {selectedEvent && (
        <div className='mt-2 mb-2 bg-gray-100 rounded-lg'>
          <button
            className='mt-4 mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
            onClick={() => setSelectedEvent(null)}
          >
            Close
          </button>
          {selectedEvent.fights.length > 0 ? (
            <ul className='space-y-4'>
              {selectedEvent.fights.map((fight) => (
                <li key={fight.id} className='p-4 bg-white shadow rounded border'>
                  <p className='text-gray-600 text-center w-full mb-4'>{fight.weight_class}</p>
                  <div className='flex items-center justify-between w-full'>
                    <img src={fight.blue_img} alt={fight.blue_name} className='w-50 h-50 rounded-full object-contain' />
                    <span className='font-semibold'>{fight.blue_name}</span>
                    <span className='text-gray-600'>vs</span>
                    <span className='font-semibold'>{fight.red_name}</span>
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
          ) : (
            <p className='text-gray-500'>No fights for this event.</p>
          )}
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
