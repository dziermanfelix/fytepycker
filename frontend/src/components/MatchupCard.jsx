import { useAuth } from '@/contexts/AuthContext';
import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const statusStyles = {
  yours: {
    bar: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
    label: 'Your Picks',
  },
  waiting: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
    label: 'Their Picks',
  },
  locked: {
    bar: 'bg-stone-400',
    badge: 'bg-stone-500/10 text-stone-600 ring-stone-500/20',
    label: 'Picks locked',
  },
  complete: {
    bar: 'bg-stone-400',
    badge: 'bg-stone-500/10 text-stone-600 ring-stone-500/20',
    label: 'Complete',
  },
};

const MatchupCard = ({ matchup, handleClick }) => {
  const { user } = useAuth();

  const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
  const openSelections = matchup.selections.filter((selection) => !selection.confirmed);
  const yourOpenPicks = openSelections.filter((selection) => selection.dibs === user.id).length;
  const betsLocked = Boolean(matchup.event?.bets_locked);
  const statusKey =
    openSelections.length === 0 ? 'complete' : betsLocked ? 'locked' : yourOpenPicks > 0 ? 'yours' : 'waiting';
  const status = statusStyles[statusKey];
  const confirmed = matchup.selections.length - openSelections.length;

  return (
    <button
      type='button'
      onClick={() => handleClick(matchup)}
      className='group relative w-full min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${status.bar}`} />

      <div className='flex min-w-0 items-center gap-2 px-2.5 py-2 pl-3.5 sm:gap-3 sm:px-3 sm:pl-4'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex flex-wrap items-center gap-1.5'>
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${status.badge}`}
            >
              {statusKey !== 'complete' && statusKey !== 'locked' && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.bar} ${statusKey === 'yours' ? 'animate-pulse' : ''}`}
                />
              )}
              {status.label}
            </span>
            <span className='text-[10px] text-stone-400'>
              {confirmed}/{matchup.selections.length} picked
            </span>
          </div>

          <div className='flex min-w-0 items-center gap-1.5'>
            <span className='min-w-0 truncate text-sm font-bold uppercase leading-tight text-stone-900'>
              {user.username}
            </span>
            <span className='shrink-0 text-[10px] font-bold tracking-wider text-stone-400'>VS</span>
            <span className='min-w-0 truncate text-sm font-bold uppercase leading-tight text-stone-900'>
              {otherUser}
            </span>
          </div>
        </div>

        <div className='shrink-0 text-right'>
          <p
            className={`text-sm font-bold tabular-nums leading-tight sm:text-base ${getWinningsTextColor(matchup.winnings)}`}
          >
            {formatWinnings(matchup.winnings)}
          </p>
          <p className='text-[10px] text-stone-400'>Bets {matchup.bets}</p>
        </div>
      </div>
    </button>
  );
};

export default MatchupCard;
