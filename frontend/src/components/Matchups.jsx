import { useMatchups, MatchupsProvider, useEvents } from '@/contexts/EventsContext';
import FightCard from '@/components/FightCard';

const MatchupsContent = () => {
  const { isLoading, isError, matchups, selectMatchup, selectedMatchup, clearSelectedMatchup, fights } = useMatchups();

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
  };

  const handleClose = () => {
    clearSelectedMatchup();
  };

  return (
    <div className='grid gap-4 max-w-5xl mx-auto mt-8'>
      {!selectedMatchup &&
        (matchups.length > 0 ? (
          matchups.map((matchup) => (
            <div
              key={matchup.id}
              className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
              onClick={() => handleClick(matchup)}
            >
              <p className='text-gray-600'>{matchup.user_a}</p>
              <p className='text-gray-600'>{matchup.user_b}</p>
            </div>
          ))
        ) : (
          <p className='text-center text-gray-500'>No matchups available.</p>
        ))}

      {selectedMatchup && (
        <div>
          <button onClick={clearSelectedMatchup}>Close</button>
          {['main', 'prelim', 'early'].map((fightKey) => (
            <FightCard
              key={fightKey}
              card={fights.event?.fights?.[fightKey]}
              matchupId={selectedMatchup.id}
              selectable={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Matchups = () => (
  <MatchupsProvider>
    <MatchupsContent />
  </MatchupsProvider>
);

export default Matchups;
