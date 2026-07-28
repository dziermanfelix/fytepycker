import { useState } from 'react';
import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import { useMatchups } from '@/contexts/MatchupsContext';
import { useAuth } from '@/contexts/AuthContext';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import EventFights from '@/components/EventFights';
import CreateMatchupModal from '@/components/CreateMatchupModal';
import LoadingEvent from './LoadingEvent';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

const CurrentEventContent = () => {
  const { isLoading, isError, selectedEvent, selectEvent, upcomingEvents } = useEvents();
  const { user } = useAuth();
  const { matchups } = useMatchups();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasCurrentMatchups = (matchups?.filter((m) => !m.event.complete) || []).length > 0;

  const openEvent = async (e, event) => {
    if (hasCurrentMatchups) return;
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
          {upcomingEvents.length > 0 ? (
            <div
              key={upcomingEvents[0]?.id}
              className={`overflow-hidden rounded-xl border border-stone-800 bg-stone-900 transition-colors${
                hasCurrentMatchups ? '' : ' cursor-pointer hover:bg-stone-800'
              }`}
              onClick={hasCurrentMatchups ? undefined : (e) => openEvent(e, upcomingEvents[0])}
            >
              <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5'>
                <div className='flex min-w-0 items-start gap-3'>
                  <button
                    className='mt-0.5 shrink-0 rounded-lg bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (upcomingEvents[0]?.url) {
                        window.open(upcomingEvents[0].url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <FaExternalLinkSquareAlt />
                  </button>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Next event</p>
                    <p className='truncate text-xl font-bold uppercase tracking-wide text-white'>
                      {upcomingEvents[0]?.name}
                    </p>
                    {upcomingEvents[0]?.headline && (
                      <p className='mt-0.5 truncate text-sm text-stone-300'>{upcomingEvents[0]?.headline}</p>
                    )}
                  </div>
                </div>
                <button
                  className='action-btn shrink-0'
                  onClick={(e) => {
                    e.stopPropagation();
                    selectEvent(upcomingEvents[0]);
                    setIsModalOpen(true);
                  }}
                >
                  Matchup
                </button>
              </div>
            </div>
          ) : (
            <p className='rounded-xl border border-dashed border-stone-300 bg-white/60 py-8 text-center text-stone-500'>
              No events.
            </p>
          )}
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
          <div className='mb-3 overflow-hidden rounded-xl border border-stone-800 bg-stone-900'>
            <div className='flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
              <EventViewCloseButton
                selectItem={selectEvent}
                basePath='/dash/matchups'
                label='Matchups'
                variant='dark'
              />
              <div className='min-w-0 sm:text-right'>
                <p className='truncate text-lg font-bold uppercase tracking-wide text-white'>{selectedEvent.name}</p>
                {selectedEvent.headline && <p className='truncate text-sm text-stone-400'>{selectedEvent.headline}</p>}
              </div>
            </div>
          </div>
          <div className='mt-2 mb-2 rounded-lg'>
            <EventFights />
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
