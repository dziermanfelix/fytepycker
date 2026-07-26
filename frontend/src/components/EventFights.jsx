import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import Fights from '@/components/Fights';
import CreateMatchupModal from './CreateMatchupModal';

const EventFights = () => {
  const { activeEventTab, selectedEvent, isLoading, isError, user, fights } = useEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enableCreateMatchup = activeEventTab === 'upcoming';

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <div className='relative'>
      <div>
        <Fights fights={fights} />
      </div>
      {enableCreateMatchup && (
        <button className='action-btn' onClick={() => setIsModalOpen(true)}>
          Create Matchup
        </button>
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
