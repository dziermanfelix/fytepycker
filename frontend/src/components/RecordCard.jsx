import { getWinningsTextColor } from '@/utils/winningsDisplayUtils';
import React from 'react';

const RecordCard = ({ item, handleClick }) => {
  return (
    <div
      key={item.user.id}
      className='
      p-5 rounded-2xl shadow-sm border border-gray-100 
      bg-white cursor-pointer 
      hover:shadow-lg hover:-translate-y-1 
      transition-all duration-200'
      onClick={() => handleClick(item.user)}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-3'>
        <div>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Opponent</p>
          <p className='text-lg font-semibold text-gray-800 capitalize'>{item.user.username}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className='grid grid-cols-2 gap-3 text-sm'>
        <div>
          <p className='text-gray-400'> {item.winnings >= 0 ? 'Winnings' : 'Losings'} </p>
          <p className={`font-semibold ${getWinningsTextColor(item.winnings)}`}>{item.winnings}</p>
        </div>
      </div>

      {/* Footer */}
      <div className='mt-4 flex justify-between text-xs text-gray-400'>
        <p>Bets: {item.bets}</p>
      </div>
    </div>
  );
};

export default RecordCard;
