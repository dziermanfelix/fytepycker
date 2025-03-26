import FightCard from '@/components/FightCard';
import { useEvents } from '@/contexts/EventsContext';

const FightCards = () => {
  const { selectedEvent, activeFightTab } = useEvents();

  const fightTabs = {
    all: ['main', 'prelim', 'early'],
    main: ['main'],
    prelim: ['prelim'],
    early: ['early'],
  };

  const fights = fightTabs[activeFightTab] || [];

  return (
    <div>
      {fights.map((fightKey) => (
        <FightCard key={fightKey} card={selectedEvent.fights[fightKey]} />
      ))}
    </div>
  );
};

export default FightCards;
