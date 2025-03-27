import { useEvents, EventsProvider } from '@/contexts/EventsContext';
import EventCards from '@/components/EventCards';
import EventTabControls from '@/components/EventTabControls';
import FightTabControls from '@/components/FightTabControls';
import EventFights from './EventFights';

const EventsContent = () => {
  const { isLoading, isError, selectedEvent, selectEvent, activeFightTab, setActiveFightTab, fights } = useEvents();

  const fightTabs = {
    all: ['main', 'prelim', 'early'],
    main: ['main'],
    prelim: ['prelim'],
    early: ['early'],
  };

  const fightCards = fightTabs[activeFightTab] || [];

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-5xl mx-auto mt-8'>
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
              {fightCards.map((fightKey) => (
                <EventFights key={fightKey} card={fights[fightKey]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Events = () => (
  <EventsProvider>
    <EventsContent />
  </EventsProvider>
);

export default Events;
