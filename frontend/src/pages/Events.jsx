import { useState } from 'react';
import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import EventTabControls from '@/components/EventTabControls';
import FightTabControls from '@/components/FightTabControls';
import EventFights from '../components/EventFights';
import CreateMatchupModal from '../components/CreateMatchupModal';

const EventsContent = () => {
  const {
    user,
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openEvent = async (e, event) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    selectEvent(event);
  };

  const events = activeEventTab === 'upcoming' ? upcomingEvents : pastEvents;
  const enableCreateMatchup = activeEventTab === 'upcoming';

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
                  className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer '
                  onClick={(e) => openEvent(e, event)}
                >
                  <div className='flex justify-between items-center'>
                    <div className='flex flex-col justify-center'>
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
                    {enableCreateMatchup && (
                      <button
                        className='px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
                        onClick={() => {
                          setIsModalOpen(true);
                        }}
                      >
                        Matchup
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500'>No events available.</p>
            )}
          </div>
        </div>
      )}

      <CreateMatchupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectEvent={selectEvent}
        selectedEvent={selectedEvent}
        user={user}
      />

      {selectedEvent && !isModalOpen && (
        <div>
          <FightTabControls
            selectItem={selectEvent}
            fights={fights}
            activeFightTab={activeFightTab}
            setActiveFightTab={setActiveFightTab}
            basePath='/dash/events'
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
