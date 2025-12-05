import { getWinningsBorderColor } from '@/utils/winningsDisplayUtils';

const RecordStats = ({ selectedUser, totalWinnings, totalBets }) => {
  return (
    <div
      className={`
    w-full p-6 rounded-2xl
    flex flex-col gap-5
    border-2
    ${getWinningsBorderColor(totalWinnings)}
  `}
    >
      {/* Username */}
      <h2 className='text-2xl font-semibold text-gray-900 capitalize'>{selectedUser.username}</h2>

      {/* Divider */}
      <div className='w-full h-px bg-gray-300/40' />

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-6 text-gray-800'>
        <div className='flex flex-col'>
          <span className='text-sm text-gray-500'>Winnings</span>
          <span className='text-2xl font-bold'>{totalWinnings >= 0 ? `+${totalWinnings}` : totalWinnings}</span>
        </div>

        <div className='flex flex-col'>
          <span className='text-sm text-gray-500'>Bets</span>
          <span className='text-2xl font-bold'>{totalBets}</span>
        </div>
      </div>
    </div>
  );
};
export default RecordStats;
