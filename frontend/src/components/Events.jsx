import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import EventTabControls from '@/components/EventTabControls';
import FightTabControls from '@/components/FightTabControls';
import EventFights from './EventFights';

const EventsContent = () => {
  const {
    isLoading,
    isError,
    selectedEvent,
    selectEvent,
    activeFightTab,
    setActiveFightTab,
    fights,
    activeEventTab,
    upcomingEvents,
    pastEvents,
  } = useEvents();

  const events = activeEventTab === 'upcoming' ? upcomingEvents : pastEvents;

  const openEvent = async (e, event) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    selectEvent(event);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-5xl mx-auto mt-2'>
      {!selectedEvent && (
        <div>
          <EventTabControls />
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
        </div>
      )}

      {selectedEvent && (
        <div>
          <FightTabControls
            selectItem={selectEvent}
            fights={fights}
            activeFightTab={activeFightTab}
            setActiveFightTab={setActiveFightTab}
          />
          <div className='mt-2 mb-2 rounded-lg'>
            <div>
              <EventFights />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Events = () => (
  <EventsProvider>
    <EventsContent />
  </EventsProvider>
);

export default Events;
