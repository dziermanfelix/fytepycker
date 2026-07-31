import { formatWinnings, getInitials, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordCard = ({ item, handleClick }) => {
  const isUp = item.winnings > 0;
  const isDown = item.winnings < 0;
  const accent = isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : 'bg-stone-400';
  const chip = isUp
    ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
    : isDown
      ? 'bg-rose-500/10 text-rose-700 ring-rose-500/20'
      : 'bg-stone-500/10 text-stone-600 ring-stone-500/20';
  const label = isUp ? 'Ahead' : isDown ? 'Behind' : 'Even';

  return (
    <button
      type='button'
      onClick={() => handleClick(item.user)}
      className='group relative w-full overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />

      <div className='flex items-center gap-4 p-4 pl-5 sm:gap-5 sm:p-5 sm:pl-6'>
        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-800 text-sm font-bold tracking-wider text-white'>
          {getInitials(item.user.username)}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex flex-wrap items-center gap-2'>
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${chip}`}
            >
              {label}
            </span>
            <span className='text-xs text-stone-400'>{item.matchup_count || 0} events</span>
          </div>
          <p className='truncate text-xl font-bold uppercase text-stone-900'>{item.user.username}</p>
          <p className='mt-0.5 text-xs text-stone-400'>{item.bets} bets settled</p>
        </div>

        <div className='shrink-0 text-right'>
          <p className='text-xs text-stone-400'>{isDown ? 'Losings' : 'Winnings'}</p>
          <p className={` text-2xl font-bold tabular-nums ${getWinningsTextColor(item.winnings)}`}>
            {formatWinnings(item.winnings)}
          </p>
        </div>

        <span className='hidden text-lg text-stone-300 group-hover:text-stone-500 sm:block'>›</span>
      </div>
    </button>
  );
};

export default RecordCard;
