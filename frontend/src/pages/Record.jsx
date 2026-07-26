import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useRecord } from '@/contexts/RecordContext';
import { FRONTEND_URLS } from '@/common/urls';
import RecordCard from '@/components/RecordCard';
import RecordMatchupCard from '@/components/RecordMatchupCard';
import RecordStats from '@/components/RecordStats';
import LoadingCards from '@/components/LoadingCards';
import { FaTrophy } from 'react-icons/fa';

const Record = () => {
  const navigate = useNavigate();
  const { isLoading, isError, items, selectedUser, setSelectedUser } = useRecord();

  useEffect(() => {
    return () => {
      setSelectedUser(null);
    };
  }, [setSelectedUser]);

  const handleUserClick = async (user) => {
    setSelectedUser(user);
  };

  const handleMatchupClick = async (matchup) => {
    sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    navigate(FRONTEND_URLS.RECORD_DETAILS(matchup.id));
  };

  if (isLoading)
    return (
      <div className='mx-auto mt-2 flex max-w-3xl flex-col gap-3'>
        <LoadingCards />
      </div>
    );
  if (isError) return <p className='text-center text-rose-500'>Failed to load Record.</p>;

  const filteredMatchups = items.flatMap((item) => (item.user.id === selectedUser?.id ? item.matchups : []));
  const totalWinnings = filteredMatchups.reduce((sum, item) => sum + item.winnings, 0);
  const totalBets = filteredMatchups.reduce((sum, item) => sum + item.bets, 0);
  const filteredItems = items.filter((item) => Array.isArray(item.matchups) && item.matchups.length > 0);

  return (
    <div className='mx-auto mt-2 grid max-w-3xl gap-2'>
      {!selectedUser && (
        <div className='flex flex-col gap-3'>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => <RecordCard key={item.user.id} item={item} handleClick={handleUserClick} />)
          ) : (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white/60 px-4 py-14'>
              <h3 className='mb-2 text-xl font-bold uppercase tracking-wide text-stone-800'>No records</h3>
              <p className='mb-6 max-w-md text-center text-stone-500'>Completed matchups get recorded here.</p>
              <button onClick={() => navigate(FRONTEND_URLS.MATCHUPS)} className='action-btn'>
                Go To Matchups
              </button>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div>
          <div className='mt-2 grid gap-3'>
            <RecordStats
              selectedUser={selectedUser}
              totalWinnings={totalWinnings}
              totalBets={totalBets}
              onBack={() => setSelectedUser(null)}
            />
            <div className='flex flex-col gap-3'>
              {filteredMatchups.length > 0 ? (
                filteredMatchups.map((matchup) => (
                  <RecordMatchupCard
                    key={matchup.id}
                    matchup={matchup}
                    handleClick={() => handleMatchupClick(matchup)}
                  />
                ))
              ) : (
                <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white/60 px-4 py-14'>
                  <div className='mb-4 rounded-full bg-stone-100 p-4'>
                    <FaTrophy className='text-3xl text-stone-400' />
                  </div>
                  <h3 className='mb-2 text-xl font-bold uppercase tracking-wide text-stone-800'>
                    No completed matchups
                  </h3>
                  <p className='max-w-md text-center text-stone-500'>
                    Once you complete matchups with {selectedUser?.username}, they'll appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Record;
