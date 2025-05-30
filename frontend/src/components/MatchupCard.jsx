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
};

export default MatchupCard;
