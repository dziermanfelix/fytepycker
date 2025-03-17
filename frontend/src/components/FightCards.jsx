import FightCard from '@/components/FightCard';
import { useEventsContext } from '@/components/Events';

const FightCards = () => {
  const { selectedEvent, activeEventTab, activeFightTab } = useEventsContext();

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
        <FightCard key={fightKey} card={selectedEvent.fights[fightKey]} selectable={activeEventTab === 'upcoming'} />
      ))}
    </div>
  );
};

export default FightCards;
