import { useResults, ResultsProvider } from '@/contexts/ResultsContext';
import EventCards from '@/components/EventCards';
import EventTabControls from '@/components/EventTabControls';
import FightTabControls from '@/components/FightTabControls';
import EventFights from './EventFights';

const ResultsContent = () => {
  const { isLoading, isError, selectedEvent, selectEvent, activeFightTab, setActiveFightTab, fights } = useResults();

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-5xl mx-auto mt-2'>
      {!selectedEvent && (
        <div>
          <EventTabControls />
          <EventCards />
        </div>
      )}

      {selectedEvent && (
        <div>
          <FightTabControls
            selectItem={selectEvent}
            fights={fights}
            activeFightTab={activeFightTab}
            setActiveFightTab={setActiveFightTab}
          />
          <div className='mt-2 mb-2 rounded-lg'>
            <div>
              <EventFights />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Results = () => (
  <ResultsProvider>
    <ResultsContent />
  </ResultsProvider>
);

export default Results;
