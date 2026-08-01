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
      className='group relative w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40'
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />

      <div className='flex items-center gap-2.5 px-3 py-2 pl-4'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold tracking-wider text-white'>
          {getInitials(item.user.username)}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <p className='truncate text-sm font-bold uppercase text-stone-900'>{item.user.username}</p>
            <span
              className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${chip}`}
            >
              {label}
            </span>
          </div>
          <p className='text-[10px] text-stone-400'>
            {item.matchup_count || 0} events · {item.bets} bets
          </p>
        </div>

        <div className='shrink-0 text-right'>
          <p className={`text-base font-bold tabular-nums leading-tight ${getWinningsTextColor(item.winnings)}`}>
            {formatWinnings(item.winnings)}
          </p>
        </div>
      </div>
    </button>
  );
};

export default RecordCard;
