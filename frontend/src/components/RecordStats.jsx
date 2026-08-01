import { formatWinnings, getInitials, getWinningsTextColor } from '@/utils/winningsDisplayUtils';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import { FRONTEND_URLS } from '@/common/urls';

const RecordStats = ({ selectedUser, totalWinnings, totalBets, onBack }) => {
  return (
    <div className='mb-2 overflow-hidden rounded-lg border border-stone-800 bg-stone-900'>
      <div className='flex items-center justify-between gap-3 px-3 py-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <EventViewCloseButton
            basePath={FRONTEND_URLS.RECORD}
            selectItem={onBack}
            label='All records'
            variant='dark'
            className='!px-1.5 !py-1 !text-xs'
          />
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold tracking-wider text-white'>
            {getInitials(selectedUser.username)}
          </div>
          <p className='truncate text-sm font-bold uppercase tracking-wide text-white'>{selectedUser.username}</p>
        </div>

        <div className='flex shrink-0 items-center gap-4'>
          <div className='text-right'>
            <p className='text-[10px] font-medium uppercase tracking-wide text-stone-400'>Net</p>
            <p className={`text-base font-bold tabular-nums leading-tight ${getWinningsTextColor(totalWinnings)}`}>
              {formatWinnings(totalWinnings)}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-[10px] font-medium uppercase tracking-wide text-stone-400'>Bets</p>
            <p className='text-base font-bold tabular-nums leading-tight text-white'>{totalBets}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordStats;
