import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';
import { getWinningsTextColor } from '@/utils/winningsDisplayUtils';
import { getReadyFight } from '@/common/fight';
import CurrentEvent from '@/components/CurrentEvent';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup, user } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(`/dash/matchups/${matchup.id}`);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  const currentMatchups = matchups.filter((matchup) => !matchup.event.complete);

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      <div className='pb-4'>
        <CurrentEvent />
      </div>
      {!id &&
        (currentMatchups.length > 0 ? (
          currentMatchups.map((matchup) => {
            const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
            const numUnconfirmed = matchup.selections.filter((selection) => !selection.confirmed).length;
            let yourTurn = null;
            const readyFight = getReadyFight(matchup.selections, matchup);
            if (readyFight) {
              const readyFightSelections = matchup.selections.filter((selection) => selection.fight === readyFight)[0];
              const userDibs = readyFightSelections.dibs == user.id;
              const userSelection =
                matchup.user_a.id === user.id
                  ? readyFightSelections.user_a_selection
                  : readyFightSelections.user_b_selection;
              const otherSelection =
                matchup.user_a.id === user.id
                  ? readyFightSelections.user_b_selection
                  : readyFightSelections.user_a_selection;
              yourTurn = (!userDibs && otherSelection !== null) || (userDibs && !userSelection);
            }

            return (
              <div
                key={matchup.id}
                className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                onClick={() => handleClick(matchup)}
              >
                <div className='flex justify-between space-x-2 w-full'>
                  <div className='flex'>
                    <p className='ml-1'>{otherUser}</p>
                  </div>
                  <div className='flex items-center'>
                    {numUnconfirmed === 0 ? (
                      <p className={`mr-4 ${getWinningsTextColor(matchup.winnings)}`}>{matchup.winnings}</p>
                    ) : yourTurn ? (
                      <span className='inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse' />
                    ) : (
                      <span className='inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className='text-center text-gray-500'>No Matchups.</p>
        ))}
    </div>
  );
};

const Matchups = () => (
  <MatchupsProvider>
    <MatchupsContent />
    <Outlet />
  </MatchupsProvider>
);

export default Matchups;
