import FightCard from '@/components/FightCard';
import { useEventsContext } from '@/components/Events';

const FightCards = () => {
  const { selectedEvent, activeEventTab, activeFightTab, matchup } = useEventsContext();

  const fightTabs = {
    all: ['main', 'prelim', 'early'],
    main: ['main'],
    prelim: ['prelim'],
    early: ['early'],
  };

  const selectedFights = fightTabs[activeFightTab] || [];

  return (
    <div>
      {selectedFights.map((fightKey) => (
        <FightCard
          key={fightKey}
          card={selectedEvent.fights[fightKey]}
          selectable={activeEventTab === 'upcoming'}
          matchup={matchup}
        />
      ))}
    </div>
  );
};

export default FightCards;
