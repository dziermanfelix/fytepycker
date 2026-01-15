import { useState } from 'react';
import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import FightTabControls from '@/components/FightTabControls';
import EventFights from '@/components/EventFights';
import CreateMatchupModal from '@/components/CreateMatchupModal';

const CurrentEventContent = () => {
  const {
    user,
    isLoading,
    isError,
    selectedEvent,
    selectEvent,
    activeFightTab,
    setActiveFightTab,
    fights,
    upcomingEvents,
  } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openEvent = async (e, event) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    selectEvent(event);
  };

  if (isLoading) {
    return (
      <div className='grid gap-2'>
        <div className='p-4 shadow-lg rounded-lg border border-gray-200 animate-pulse'>
          <div className='flex justify-between items-center'>
            <div className='flex flex-col justify-center space-y-2 flex-1'>
              <div className='h-5 bg-gray-200 rounded w-3/4'></div>
              <div className='h-4 bg-gray-200 rounded w-1/2'></div>
            </div>
            <div className='h-10 w-24 bg-gray-300 rounded-lg'></div>
          </div>
        </div>
      </div>
    );
  }
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className=''>
      {!selectedEvent && (
        <div>
          <div className='grid gap-2'>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div
                  key={event?.id}
                  className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                  onClick={(e) => openEvent(e, event)}
                >
                  <div className='flex justify-between items-center'>
                    <div className='flex flex-col justify-center'>
                      {event?.url && (
                        <div className='flex items-center space-x-2'>
                          <a
                            href={event?.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:text-gray-700'
                          >
                            {event?.name} | {event?.headline} | {new Date(event?.date).toLocaleString()}
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      className='px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:cursor-pointer hover:bg-yellow-700 hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
                      onClick={() => {
                        setIsModalOpen(true);
                      }}
                    >
                      Matchup
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500'>No events.</p>
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
            basePath='/dash/matchups'
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

const CurrentEvent = () => (
  <EventsProvider>
    <CurrentEventContent />
  </EventsProvider>
);

export default CurrentEvent;
