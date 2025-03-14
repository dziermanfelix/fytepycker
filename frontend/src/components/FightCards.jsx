import FightCard from '@/components/FightCard';

const FightCards = ({ selectedEvent, activeEventTab, activeFightTab, matchup }) => {
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
