import { useMatchups } from '@/contexts/MatchupsContext';
import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordMatchupCard = ({ matchup, handleClick }) => {
  const { user } = useMatchups();

  const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
  const firstPick = matchup.first_pick === matchup.user_a.id ? matchup.user_a.username : matchup.user_b.username;
  const isUp = matchup.winnings > 0;
  const isDown = matchup.winnings < 0;
  const accent = isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : 'bg-stone-400';
  const eventDate = matchup.event?.date
    ? new Date(matchup.event.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <button
      type='button'
      onClick={() => handleClick(matchup)}
      className='group relative w-full overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />

      <div className='border-b border-stone-800 bg-stone-900 px-4 py-3 pl-5 sm:px-5 sm:pl-6'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='truncate text-sm font-bold uppercase tracking-wide text-white'>{matchup.event.name}</p>
            {matchup.event.headline && (
              <p className='mt-0.5 truncate text-xs text-stone-400'>{matchup.event.headline}</p>
            )}
          </div>
          <p className='shrink-0 text-xs text-stone-400'>{eventDate}</p>
        </div>
      </div>

      <div className='flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 sm:pl-6'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='flex min-w-0 flex-1 flex-col items-end text-right'>
              <span className='text-xs text-stone-400'>You</span>
              <span className='truncate text-lg font-bold uppercase leading-tight text-stone-900'>{user.username}</span>
            </div>

            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold tracking-wider text-white'>
              VS
            </div>

            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-xs text-stone-400'>Opponent</span>
              <span className='truncate text-lg font-bold uppercase leading-tight text-stone-900'>{otherUser}</span>
            </div>
          </div>
        </div>

        <div className='flex items-end justify-between gap-4 border-t border-stone-100 pt-3 sm:min-w-[9rem] sm:flex-col sm:items-end sm:border-t-0 sm:border-l sm:border-stone-100 sm:pl-6 sm:pt-0'>
          <div className='sm:text-right'>
            <p className='text-xs text-stone-400'>Result</p>
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

export default RecordMatchupCard;
