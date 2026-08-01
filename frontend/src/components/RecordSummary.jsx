import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordSummary = ({ wins, losses, total }) => {
  return (
    <div className='overflow-hidden rounded-lg border border-stone-800 bg-stone-900'>
      <div className='grid grid-cols-2 divide-x divide-white/10'>
        <div className='px-3 py-2.5 text-center'>
          <p className='text-[10px] font-medium uppercase tracking-wide text-stone-400'>Record</p>
          <p className='text-lg font-bold tabular-nums leading-tight text-white'>
            {wins}-{losses}
          </p>
        </div>
        <div className='px-3 py-2.5 text-center'>
          <p className='text-[10px] font-medium uppercase tracking-wide text-stone-400'>Total</p>
          <p className={`text-lg font-bold tabular-nums leading-tight ${getWinningsTextColor(total)}`}>
            {formatWinnings(total)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordSummary;
