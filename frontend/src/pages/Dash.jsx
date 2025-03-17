import React from 'react';
import Events from '@/components/Events';
import Matchups from '@/components/Matchups';

const Dash = () => {
  return (
    <div className='mx-auto'>
      <div className='min-h-screen p-4'>
        <Events />
        <div className='mt-4'>
          <Matchups />
        </div>
      </div>
    </div>
  );
};

export default Dash;
