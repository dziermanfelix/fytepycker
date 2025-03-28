import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEvents } from '@/contexts/EventsContext';

const EventCards = () => {
  const { selectEvent, activeEventTab, upcomingEvents, pastEvents, user } = useEvents();

  const events = activeEventTab === 'upcoming' ? upcomingEvents : pastEvents;

  const handleClick = async (event) => {
    selectEvent(event);
    if (activeEventTab == 'upcoming') {
      const { data } = await client.post(API_URLS.MATCHUPS, { event: event.id, user_a: user.id, user_b: user.id });
    }
  };

  return (
    <div className='grid gap-4'>
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event.id}
            className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
            onClick={() => handleClick(event)}
          >
            {event.url && (
              <a href={event.url} target='_blank' rel='noopener noreferrer' className='underline'>
                {event.name}
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
  );
};

export default EventCards;
