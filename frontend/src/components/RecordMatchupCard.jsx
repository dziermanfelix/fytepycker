import { useAuth } from '@/contexts/AuthContext';
import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordMatchupCard = ({ matchup, handleClick }) => {
  const { user } = useAuth();

  const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
  const isUp = matchup.winnings > 0;
  const isDown = matchup.winnings < 0;
  const accent = isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : 'bg-stone-400';
  const eventDate = matchup.event?.date
    ? new Date(matchup.event.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <button
      type='button'
      onClick={() => handleClick(matchup)}
      className='group relative w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />

      <div className='flex items-center gap-3 px-3 py-2 pl-4'>
        <div className='min-w-0 flex-1'>
          <div className='mb-0.5 flex min-w-0 items-center gap-1.5'>
            <p className='truncate text-xs font-semibold uppercase tracking-wide text-stone-500'>
              {matchup.event.name}
            </p>
            {eventDate && <span className='shrink-0 text-[10px] text-stone-400'>{eventDate}</span>}
          </div>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate text-sm font-bold uppercase leading-tight text-stone-900'>{user.username}</span>
            <span className='shrink-0 text-[10px] font-bold tracking-wider text-stone-400'>VS</span>
            <span className='truncate text-sm font-bold uppercase leading-tight text-stone-900'>{otherUser}</span>
          </div>
        </div>

        <div className='shrink-0 text-right'>
          <p className={`text-base font-bold tabular-nums leading-tight ${getWinningsTextColor(matchup.winnings)}`}>
            {formatWinnings(matchup.winnings)}
          </p>
          <p className='text-[10px] text-stone-400'>Bets {matchup.bets}</p>
        </div>
      </div>
    </button>
  );
};

export default RecordMatchupCard;
