import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import Fights from '@/components/Fights';
import Spinner from '@/components/Spinner';
import CreateMatchupModal from './CreateMatchupModal';

const EventFights = () => {
  const { selectedEvent, isLoading, isError, isLoadingDetail, isDetailError, fights } = useEvents();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || isLoadingDetail) return <Spinner />;
  if (isError || isDetailError) return <p className='text-center text-rose-500'>Error loading fights.</p>;

  return (
    <div className='relative'>
      <div>
        <Fights fights={fights} />
      </div>
      <button className='action-btn' onClick={() => setIsModalOpen(true)}>
        Create Matchup
      </button>

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
