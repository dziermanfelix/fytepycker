import FightCard from '@/components/FightCard';
import { useEvents } from '@/contexts/EventsContext';

const FightCards = () => {
  const { selectedEvent, activeEventTab, activeFightTab } = useEvents();

  const fightTabs = {
    all: ['main', 'prelim', 'early'],
    main: ['main'],
    prelim: ['prelim'],
    early: ['early'],
  };

  const fightsToDisplay = fightTabs[activeFightTab] || [];

  return (
    <div>
      {fightsToDisplay.map((fightKey) => (
        <FightCard key={fightKey} card={selectedEvent.fights[fightKey]} />
      ))}
    </div>
  );
};

export default FightCards;
