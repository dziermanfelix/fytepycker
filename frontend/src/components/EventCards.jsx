import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';

const EventCards = () => {
  const { user } = useAuth();
  const { setSelectedEvent, activeEventTab, setMatchup, upcomingEvents, pastEvents } = useEvents();

  const events = activeEventTab === 'upcoming' ? upcomingEvents : pastEvents;

  const handleClick = async (event) => {
    setSelectedEvent(event);
    if (activeEventTab == 'upcoming') {
      const { data } = await client.post(API_URLS.MATCHUPS, { event: event.id, user_a: user.id, user_b: user.id });
      setMatchup(data.matchup.id);
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
