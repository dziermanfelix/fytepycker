import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordSummary = ({ wins, losses, total }) => {
  return (
    <div className='overflow-hidden rounded-xl border border-stone-800 bg-stone-900'>
      <div className='grid grid-cols-2 divide-x divide-white/10'>
        <div className='px-4 py-5 text-center sm:px-5 sm:py-6'>
          <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Record</p>
          <p className='mt-1 text-2xl font-bold tabular-nums text-white sm:text-3xl'>
            {wins}-{losses}
          </p>
        </div>
        <div className='px-4 py-5 text-center sm:px-5 sm:py-6'>
          <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Total</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${getWinningsTextColor(total)}`}>
            {formatWinnings(total)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordSummary;
