import { useMatchups } from '@/contexts/MatchupsContext';
import { getReadyFight } from '@/common/fight';
import { getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const MatchupCard = ({ matchup, handleClick }) => {
  const { user } = useMatchups();

  const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
  const numUnconfirmed = matchup.selections.filter((selection) => !selection.confirmed).length;
  const readyFight = getReadyFight(matchup.selections, matchup);

  let yourTurn = false;
  if (readyFight) {
    const readyFightSelections = matchup.selections.filter((selection) => selection.fight === readyFight)[0];
    const userDibs = readyFightSelections.dibs == user.id;
    const userSelection =
      matchup.user_a.id === user.id ? readyFightSelections.user_a_selection : readyFightSelections.user_b_selection;
    const otherSelection =
      matchup.user_a.id === user.id ? readyFightSelections.user_b_selection : readyFightSelections.user_a_selection;
    yourTurn = (!userDibs && otherSelection !== null) || (userDibs && !userSelection);
  }

  const firstPick = matchup.first_pick === matchup.user_a.id ? matchup.user_a.username : matchup.user_b.username;

  console.log('userId', user.id);
  console.log('matchupFirstPickId', matchup.first_pick);
  console.log('matchup', matchup);

  return (
    <div
      key={matchup.id}
      onClick={() => handleClick(matchup)}
      className='p-5 rounded-2xl shadow-sm border border-gray-100 bg-white cursor-pointer 
             hover:shadow-lg hover:-translate-y-1 transition-all duration-200'
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-3'>
        <div>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Opponent</p>
          <p className='text-lg font-semibold text-gray-800 capitalize'>{otherUser}</p>
        </div>

        {/* Status Dot */}
        <div>
          {numUnconfirmed === 0 ? (
            <span className='inline-block w-3 h-3 bg-black rounded-full' />
          ) : yourTurn ? (
            <span className='inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse' />
          ) : (
            <span className='inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse' />
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className='grid grid-cols-2 gap-3 text-sm'>
        <div>
          <p className='text-gray-400'>Winnings</p>
          <p className={`font-semibold ${getWinningsTextColor(matchup.winnings)}`}>{matchup.winnings}</p>
        </div>

        <div>
          <p className='text-gray-400'>Selection Status</p>
          {yourTurn ? (
            <p className='font-semibold text-red-500'>Your Move</p>
          ) : numUnconfirmed === 0 ? (
            <p className='font-semibold text-gray-500'>Complete</p>
          ) : (
            <p className='font-semibold text-green-600'>Waiting</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='mt-4 flex justify-between text-xs text-gray-400'>
        <span>First Pick: {firstPick}</span>
        <p>Bets: {matchup.bets}</p>
      </div>
    </div>
  );
};

export default MatchupCard;
