import { useMatchups } from '@/contexts/MatchupsContext';
import { getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const RecordMatchupCard = ({ matchup, handleClick }) => {
  const { user } = useMatchups();

  const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
  const firstPick = matchup.first_pick === matchup.user_a.id ? matchup.user_a.username : matchup.user_b.username;

  return (
    <div
      key={matchup.id}
      onClick={() => handleClick(matchup)}
      className='p-5 rounded-2xl shadow-sm border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer'
    >
      {/* Event Info */}
      <div className='mb-4'>
        <p className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Event</p>
        <p className='text-sm font-medium text-gray-700'>{matchup.event.name}</p>
        <p className='text-xs text-gray-500'>{matchup.event.headline}</p>
        <p className='text-xs text-gray-500'>{new Date(matchup.event.date).toLocaleString()}</p>
      </div>

      {/* Header */}
      <div className='flex justify-between items-start mb-4'>
        <div>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Opponent</p>
          <div className='flex items-center gap-2'>
            <p className='text-lg font-semibold text-gray-800 capitalize'>{otherUser}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <p className='text-gray-400 text-xs uppercase tracking-wide'>Winnings</p>
          <p className={`font-semibold ${getWinningsTextColor(matchup.winnings)}`}>{matchup.winnings}</p>
        </div>

        <div>
          <p className='text-gray-400 text-xs uppercase tracking-wide'>Bets</p>
          <p className='font-medium text-gray-700'>{matchup.bets}</p>
        </div>
      </div>

      {/* Footer */}
      <div className='mt-5 text-xs text-gray-400'>
        <span className='block'>First Pick: {firstPick}</span>
      </div>
    </div>
  );
};

export default RecordMatchupCard;
