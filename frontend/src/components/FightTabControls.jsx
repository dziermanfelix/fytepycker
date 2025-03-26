import { useEvents } from '@/contexts/EventsContext';

const FightTabControls = () => {
  const { selectedEvent, selectEvent, activeFightTab, setActiveFightTab } = useEvents();
  return (
    <div className='flex border-b mb-6'>
      <button
        className={`px-4 py-2 mr-2 cursor-pointer ${
          activeFightTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''
        }`}
        onClick={() => setActiveFightTab('all')}
      >
        All (
        {selectedEvent.fights?.main?.length +
          (selectedEvent.fights?.prelim?.length || 0) +
          (selectedEvent.fights?.early?.length || 0)}
        )
      </button>
      {selectedEvent.fights?.main && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'main' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('main')}
        >
          Main ({selectedEvent.fights.main.length})
        </button>
      )}
      {selectedEvent.fights?.prelim && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'prelim' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('prelim')}
        >
          Prelim ({selectedEvent.fights.prelim.length})
        </button>
      )}
      {selectedEvent.fights?.early && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'early' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('early')}
        >
          Early ({selectedEvent.fights.early.length})
        </button>
      )}
      <button
        className={`px-4 py-2 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600`}
        onClick={() => {
          selectEvent(null);
          setActiveFightTab('all');
        }}
      >
        Close
      </button>
    </div>
  );
};

export default FightTabControls;
