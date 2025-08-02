import { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import Fights from '@/components/Fights';
import CreateMatchupModal from './CreateMatchupModal';

const EventFights = () => {
  const { activeEventTab, activeFightTab, selectedEvent, isLoading, isError, user, fights } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const enableCreateMatchup = activeEventTab === 'upcoming';

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <div className='relative'>
      <Fights activeFightTab={activeFightTab} fights={fights} />
      {enableCreateMatchup && (
        <button
          className='mt-2 mb-2 px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
          onClick={() => setIsModalOpen(true)}
        >
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
