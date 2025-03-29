import { useEvents } from '@/contexts/EventsContext';

const EventTabControls = () => {
  const { activeEventTab, setActiveEventTab } = useEvents();

  return (
    <div className='flex border-b mb-2'>
      <button
        className={`px-4 py-2 mr-2 cursor-pointer hover:text-gray-700 ${
          activeEventTab === 'upcoming' ? 'border-b-2 border-blue-900 font-semibold' : ''
        }`}
        onClick={() => setActiveEventTab('upcoming')}
      >
        Upcoming
      </button>
      <button
        className={`px-4 py-2 cursor-pointer hover:text-gray-700 ${
          activeEventTab === 'past' ? 'border-b-2 border-blue-900 font-semibold' : ''
        }`}
        onClick={() => setActiveEventTab('past')}
      >
        Past
      </button>
    </div>
  );
};

export default EventTabControls;
