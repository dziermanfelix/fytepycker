import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';
import MatchupFights from '@/components/MatchupFights';
import FightTabControls from '@/components/FightTabControls';

const MatchupsContent = () => {
  const { isLoading, isError, matchups, selectMatchup, selectedMatchup, activeFightTab, setActiveFightTab, fights } =
    useMatchups();

  const filteredMatchups = matchups.filter((matchup) => !(matchup.user_a === matchup.user_b));

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  return (
    <div className='grid gap-4 max-w-5xl mx-auto mt-8'>
      {!selectedMatchup &&
        (filteredMatchups.length > 0 ? (
          filteredMatchups.map((matchup) => (
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
          <FightTabControls
            selectItem={selectMatchup}
            fights={fights}
            activeFightTab={activeFightTab}
            setActiveFightTab={setActiveFightTab}
          />
          <MatchupFights selectable={true} />
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
