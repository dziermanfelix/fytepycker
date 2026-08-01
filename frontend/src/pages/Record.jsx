import { useNavigate } from 'react-router-dom';
import { useRecord } from '@/contexts/RecordContext';
import { FRONTEND_URLS } from '@/common/urls';
import RecordCard from '@/components/RecordCard';
import RecordMatchupCard from '@/components/RecordMatchupCard';
import RecordStats from '@/components/RecordStats';
import RecordSummary from '@/components/RecordSummary';
import Spinner from '@/components/Spinner';
import { FaTrophy } from 'react-icons/fa';

const Record = () => {
  const navigate = useNavigate();
  const { isLoading, isError, isLoadingDetail, isDetailError, items, selectedUser, setSelectedUser, selectedMatchups } =
    useRecord();

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleMatchupClick = (matchup) => {
    sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    navigate(FRONTEND_URLS.RECORD_DETAILS(matchup.id));
  };

  if (isLoading) return <Spinner />;
  if (isError) return <p className='text-center text-rose-500'>Failed to load Record.</p>;

  const selectedItem = items.find((item) => item.user.id === selectedUser?.id);
  const totalWinnings = selectedItem?.winnings ?? 0;
  const totalBets = selectedItem?.bets ?? 0;

  const summaryWins = items.reduce((sum, item) => sum + (item.wins || 0), 0);
  const summaryLosses = items.reduce((sum, item) => sum + (item.losses || 0), 0);
  const summaryTotal = items.reduce((sum, item) => sum + (item.winnings || 0), 0);

  return (
    <div className='mx-auto mt-2 grid max-w-3xl gap-2'>
      {!selectedUser && (
        <div className='flex flex-col gap-2'>
          {items.length > 0 ? (
            <>
              <RecordSummary wins={summaryWins} losses={summaryLosses} total={summaryTotal} />
              {items.map((item) => (
                <RecordCard key={item.user.id} item={item} handleClick={handleUserClick} />
              ))}
            </>
          ) : (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/60 px-4 py-10'>
              <h3 className='mb-1 text-lg font-bold uppercase tracking-wide text-stone-800'>No records</h3>
              <p className='mb-4 max-w-md text-center text-sm text-stone-500'>Completed matchups get recorded here.</p>
              <button onClick={() => navigate(FRONTEND_URLS.MATCHUPS)} className='action-btn'>
                Go To Matchups
              </button>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div>
          <div className='mt-1 grid gap-2'>
            <RecordStats
              selectedUser={selectedUser}
              totalWinnings={totalWinnings}
              totalBets={totalBets}
              onBack={() => setSelectedUser(null)}
            />
            {isLoadingDetail && <Spinner />}
            {isDetailError && <p className='text-center text-rose-500'>Failed to load matchups.</p>}
            {!isLoadingDetail && !isDetailError && (
              <div className='flex flex-col gap-2'>
                {selectedMatchups.length > 0 ? (
                  selectedMatchups.map((matchup) => (
                    <RecordMatchupCard
                      key={matchup.id}
                      matchup={matchup}
                      handleClick={() => handleMatchupClick(matchup)}
                    />
                  ))
                ) : (
                  <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/60 px-4 py-10'>
                    <div className='mb-3 rounded-full bg-stone-100 p-3'>
                      <FaTrophy className='text-2xl text-stone-400' />
                    </div>
                    <h3 className='mb-1 text-lg font-bold uppercase tracking-wide text-stone-800'>
                      No completed matchups
                    </h3>
                    <p className='max-w-md text-center text-sm text-stone-500'>
                      Once you complete matchups with {selectedUser?.username}, they'll appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Record;
