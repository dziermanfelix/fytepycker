import { useState } from 'react';
import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import EventFights from '@/components/EventFights';
import CreateMatchupModal from '@/components/CreateMatchupModal';
import LoadingEvent from './LoadingEvent';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

const CurrentEventContent = () => {
  const { user, isLoading, isError, selectedEvent, selectEvent, fights, upcomingEvents } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openEvent = async (e, event) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    selectEvent(event);
  };

  if (isLoading) return <LoadingEvent />;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className=''>
      {!selectedEvent && (
        <div>
          <div className='grid gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-1'>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div
                  key={event?.id}
                  className='p-4 shadow-lg rounded-lg border border-gray-200'
                  onClick={(e) => openEvent(e, event)}
                >
                  <div className='flex justify-between items-center'>
                    <div className='flex space-x-2 justify-center'>
                      <button
                        className='mr-4 px-2 py-2 text-xs font-semibold rounded-lg shadow-md hover:shadow-lg bg-gray-50 hover:bg-gray-200'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (event?.url) {
                            window.open(event.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        <FaExternalLinkSquareAlt />
                      </button>
                      <div className='flex items-center space-x-2'>
                        <p className=''>
                          {event?.name} - {event?.headline}
                        </p>
                      </div>
                    </div>
                    <button
                      className='px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-700 hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
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
          <EventViewCloseButton selectItem={selectEvent} basePath='/dash/matchups' />
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
