import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';
import MatchupFights from '@/components/MatchupFights';
import FightTabControls from '@/components/FightTabControls';

const MatchupsContent = () => {
  const { isLoading, isError, matchups, selectMatchup, selectedMatchup, activeFightTab, setActiveFightTab, fights } =
    useMatchups();

  const filteredMatchups = matchups.filter((matchup) => !(matchup?.user_a?.username === matchup?.user_b?.username));

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      {!selectedMatchup &&
        (filteredMatchups.length > 0 ? (
          filteredMatchups.map((matchup) => (
            <div
              key={matchup.id}
              className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
              onClick={() => handleClick(matchup)}
            >
              <div>
                <div className='flex items-center space-x-2'>
                  <p className='text-gray-600'>
                    {matchup?.event?.name} | {matchup?.event?.headline}
                  </p>
                </div>
                <p className='capitalize'>versus {matchup?.user_b?.username ?? 'No user data.'}</p>
              </div>
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
          <MatchupFights />
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
