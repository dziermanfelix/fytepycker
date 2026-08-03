import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import Fights from '@/components/Fights';
import Spinner from '@/components/Spinner';
import CreateMatchupModal from './CreateMatchupModal';

const hasFightCards = (fights) => Object.values(fights || {}).some((card) => card?.length > 0);

const EventFights = () => {
  const { selectedEvent, isLoading, isError, isLoadingDetail, isDetailError, fights } = useEvents();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || isLoadingDetail) return <Spinner />;
  if (isError || isDetailError) return <p className='text-center text-rose-500'>Error loading fights.</p>;

  return (
    <div className='relative flex flex-col gap-3'>
      {hasFightCards(fights) ? (
        <>
          <Fights fights={fights} />
          <button className='action-btn mt-4' onClick={() => setIsModalOpen(true)}>
            Create Matchup
          </button>
        </>
      ) : (
        <div className='rounded-lg border border-dashed border-stone-300 bg-white/60 px-3 py-10 text-center text-stone-500'>
          <p className='text-base font-semibold uppercase tracking-wide'>No fights yet</p>
          <p className='mt-1 text-sm'>Fights will show up here once the card is posted.</p>
        </div>
      )}

      <CreateMatchupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedEvent={selectedEvent}
        user={user}
      />
    </div>
  );
};

export default EventFights;
