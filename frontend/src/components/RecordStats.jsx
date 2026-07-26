import { formatWinnings, getInitials, getWinningsTextColor } from '@/utils/winningsDisplayUtils';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import { FRONTEND_URLS } from '@/common/urls';

const RecordStats = ({ selectedUser, totalWinnings, totalBets, onBack }) => {
  return (
    <div className='mb-4 overflow-hidden rounded-xl border border-stone-800 bg-stone-900'>
      <div className='flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5'>
        <EventViewCloseButton basePath={FRONTEND_URLS.RECORD} selectItem={onBack} label='All records' variant='dark' />
      </div>

      <div className='flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-4'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold tracking-wider text-white'>
            {getInitials(selectedUser.username)}
          </div>
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Head to head</p>
            <h2 className='text-2xl font-bold uppercase tracking-wide text-white'>{selectedUser.username}</h2>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-6 sm:gap-10'>
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Net</p>
            <p className={` text-3xl font-bold tabular-nums ${getWinningsTextColor(totalWinnings)}`}>
              {formatWinnings(totalWinnings)}
            </p>
          </div>
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Bets</p>
            <p className='text-3xl font-bold tabular-nums text-white'>{totalBets}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordStats;
