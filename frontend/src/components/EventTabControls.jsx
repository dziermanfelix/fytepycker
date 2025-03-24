import { useEvents } from '@/contexts/EventsContext';

const EventTabControls = () => {
  const { activeEventTab, setActiveEventTab, upcomingEvents, pastEvents } = useEvents();

  return (
    <div className='flex border-b mb-6'>
      <button
        className={`px-4 py-2 mr-2 cursor-pointer ${
          activeEventTab === 'upcoming' ? 'border-b-2 border-blue-500 font-semibold' : ''
        }`}
        onClick={() => setActiveEventTab('upcoming')}
      >
        Upcoming ({upcomingEvents.length})
      </button>
      <button
        className={`px-4 py-2 cursor-pointer ${
          activeEventTab === 'past' ? 'border-b-2 border-blue-500 font-semibold' : ''
        }`}
        onClick={() => setActiveEventTab('past')}
      >
        Past ({pastEvents.length})
      </button>
    </div>
  );
};

export default EventTabControls;
