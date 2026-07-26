import { useAuth } from '@/contexts/AuthContext';
import { getReadyFight } from '@/common/fight';
import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const statusStyles = {
  yours: {
    bar: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
    label: 'Your Move',
  },
  waiting: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
    label: 'Waiting',
  },
  complete: {
    bar: 'bg-stone-400',
    badge: 'bg-stone-500/10 text-stone-600 ring-stone-500/20',
    label: 'Locked',
  },
};

const MatchupCard = ({ matchup, handleClick }) => {
  const { user } = useAuth();

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
  const statusKey = numUnconfirmed === 0 ? 'complete' : yourTurn ? 'yours' : 'waiting';
  const status = statusStyles[statusKey];
  const confirmed = matchup.selections.length - numUnconfirmed;

  return (
    <button
      type='button'
      onClick={() => handleClick(matchup)}
      className='group relative w-full overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${status.bar}`} />

      <div className='flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 sm:pl-6'>
        <div className='min-w-0 flex-1'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${status.badge}`}
            >
              {statusKey !== 'complete' && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.bar} ${statusKey === 'yours' ? 'animate-pulse' : ''}`}
                />
              )}
              {status.label}
            </span>
            <span className='text-xs text-stone-400'>
              {confirmed}/{matchup.selections.length} locked
            </span>
          </div>

          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='flex min-w-0 flex-1 flex-col items-end text-right'>
              <span className='text-xs text-stone-400'>You</span>
              <span className='truncate text-lg font-bold uppercase leading-tight text-stone-900 sm:text-xl'>
                {user.username}
              </span>
            </div>

            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[11px] font-bold tracking-wider text-white'>
              VS
            </div>

            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-xs text-stone-400'>Opponent</span>
              <span className='truncate text-lg font-bold uppercase leading-tight text-stone-900 sm:text-xl'>
                {otherUser}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-end justify-between gap-4 border-t border-stone-100 pt-3 sm:min-w-[9.5rem] sm:flex-col sm:items-end sm:border-t-0 sm:border-l sm:border-stone-100 sm:pl-6 sm:pt-0'>
          <div className='sm:text-right'>
            <p className='text-xs text-stone-400'>On the board</p>
            <p className={` text-2xl font-bold tabular-nums ${getWinningsTextColor(matchup.winnings)}`}>
              {formatWinnings(matchup.winnings)}
            </p>
          </div>
          <div className='text-right text-xs text-stone-400'>
            <p>Bets {matchup.bets}</p>
            <p className='capitalize'>
              First: <span className='text-stone-600'>{firstPick}</span>
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MatchupCard;
