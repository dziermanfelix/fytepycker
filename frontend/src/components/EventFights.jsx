import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import Fights from '@/components/Fights';
import CreateMatchupModal from './CreateMatchupModal';

const EventFights = () => {
  const { selectedEvent, isLoading, isError, fights } = useEvents();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

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
