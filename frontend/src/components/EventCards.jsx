import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEvents } from '@/contexts/EventsContext';

const EventCards = () => {
  const { selectEvent, activeEventTab, upcomingEvents, pastEvents, user } = useEvents();

  const events = activeEventTab === 'upcoming' ? upcomingEvents : pastEvents;

  const openEvent = async (e, event) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    // create default matchup for upcoming fight
    if (activeEventTab == 'upcoming') {
      const { data } = await client.post(API_URLS.MATCHUPS, {
        event_id: event?.id,
        user_a_id: user?.id,
        user_b_id: user?.id,
      });
    }
    selectEvent(event);
  };

  return (
    <div className='grid gap-2'>
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event?.id}
            className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
            onClick={(e) => openEvent(e, event)}
          >
            {event?.url && (
              <div className='flex items-center space-x-2'>
                <a href={event?.url} target='_blank' rel='noopener noreferrer' className='underline'>
                  {event?.name} | {event?.headline}
                </a>
              </div>
            )}

            <p className='text-gray-600'>{new Date(event?.date).toLocaleString()}</p>
            <p className='text-gray-700'>{event?.location}</p>
          </div>
        ))
      ) : (
        <p className='text-center text-gray-500'>No events available.</p>
      )}
    </div>
  );
};

export default EventCards;
