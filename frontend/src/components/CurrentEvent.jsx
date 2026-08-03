import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { useMatchups } from '@/contexts/MatchupsContext';
import { useAuth } from '@/contexts/AuthContext';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import EventFights from '@/components/EventFights';
import CreateMatchupModal from '@/components/CreateMatchupModal';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

const formatEventDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

const CurrentEvent = () => {
  const { isError, selectedEvent, selectEvent, upcomingEvents } = useEvents();
  const { user } = useAuth();
  const { matchups } = useMatchups();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasCurrentMatchups = (matchups || []).length > 0;
  const nextEvent = upcomingEvents[0];
  const nextEventDate = formatEventDate(nextEvent?.date);
  const selectedEventDate = formatEventDate(selectedEvent?.date);

  const openEvent = async (e, event) => {
    if (hasCurrentMatchups) return;
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }
    selectEvent(event);
  };

  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className=''>
      {!selectedEvent && (
        <div>
          {upcomingEvents.length > 0 ? (
            <div
              key={nextEvent?.id}
              className={`overflow-hidden rounded-lg border border-stone-800 bg-stone-900 transition-colors${
                hasCurrentMatchups ? '' : ' cursor-pointer hover:bg-stone-800'
              }`}
              onClick={hasCurrentMatchups ? undefined : (e) => openEvent(e, nextEvent)}
            >
              <div className='flex min-w-0 items-center justify-between gap-2 px-2.5 py-2 sm:gap-3 sm:px-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <button
                    className='shrink-0 rounded-md bg-white/10 p-1.5 text-sm text-white transition-colors hover:bg-white/20'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (nextEvent?.url) {
                        window.open(nextEvent.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <FaExternalLinkSquareAlt />
                  </button>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-bold uppercase tracking-wide text-white'>
                      {nextEvent?.name}
                      {nextEvent?.headline && (
                        <span className='font-normal normal-case tracking-normal text-stone-400'>
                          {' · '}
                          {nextEvent?.headline}
                        </span>
                      )}
                    </p>
                    {nextEventDate && <p className='truncate text-[10px] text-stone-400 sm:hidden'>{nextEventDate}</p>}
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  {nextEventDate && <p className='hidden text-xs text-stone-400 sm:block'>{nextEventDate}</p>}
                  {nextEvent?.has_fights && (
                    <button
                      className='action-btn !px-2.5 !py-1 !text-xs'
                      onClick={(e) => {
                        e.stopPropagation();
                        selectEvent(nextEvent);
                        setIsModalOpen(true);
                      }}
                    >
                      Matchup
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className='rounded-lg border border-dashed border-stone-300 bg-white/60 py-8 text-center text-stone-500'>
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
          <div className='mb-3 overflow-hidden rounded-lg border border-stone-800 bg-stone-900'>
            <div className='flex min-w-0 items-center justify-between gap-2 px-2.5 py-2 sm:gap-3 sm:px-3'>
              <EventViewCloseButton
                selectItem={selectEvent}
                basePath='/dash/matchups'
                label='Matchups'
                variant='dark'
                className='!px-1.5 !py-1 !text-xs'
              />
              <div className='min-w-0 text-right'>
                <p className='truncate text-sm font-bold uppercase tracking-wide text-white'>
                  {selectedEvent.name}
                  {selectedEvent.headline && (
                    <span className='font-normal normal-case tracking-normal text-stone-400'>
                      {' · '}
                      {selectedEvent.headline}
                    </span>
                  )}
                </p>
                {selectedEventDate && <p className='truncate text-[10px] text-stone-400'>{selectedEventDate}</p>}
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

export default CurrentEvent;
