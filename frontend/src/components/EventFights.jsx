import { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '@/contexts/EventsContext';
import Fights from '@/components/Fights';
import CreateMatchupModal from './CreateMatchupModal';

const EventFights = () => {
  const { activeEventTab, selectedEvent, isLoading, isError, user, fights } = useEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const fightsRef = useRef(null);

  const enableCreateMatchup = activeEventTab === 'upcoming';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!fightsRef.current.contains(e.target)) {
        navigate('dash/matchups');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <div className='relative'>
      <div ref={fightsRef}>
        <Fights fights={fights} />
      </div>
      {enableCreateMatchup && (
        <button
          className='mb-2 px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
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
