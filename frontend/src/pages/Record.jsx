import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useRecord, RecordProvider } from '@/contexts/RecordContext';
import { FRONTEND_URLS } from '@/common/urls';
import RecordCard from '@/components/RecordCard';
import { MatchupsProvider } from '@/contexts/MatchupsContext';
import RecordMatchupCard from '@/components/RecordMatchupCard';
import RecordStats from '@/components/RecordStats';
import LoadingCards from '@/components/LoadingCards';
import { FaTrophy } from 'react-icons/fa';
import EventViewCloseButton from '@/components/EventViewCloseButton';

const RecordContent = () => {
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
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <LoadingCards />
      </div>
    );
  if (isError) return <p className='text-center text-red-500'>Failed to load Record.</p>;

  const filteredMatchups = items.flatMap((item) => (item.user.id === selectedUser?.id ? item.matchups : []));
  const totalWinnings = filteredMatchups.reduce((sum, item) => sum + item.winnings, 0);
  const totalBets = filteredMatchups.reduce((sum, item) => sum + item.bets, 0);
  const filteredItems = items.filter((item) => Array.isArray(item.matchups) && item.matchups.length > 0);

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {!selectedUser &&
          (filteredItems.length > 0 ? (
            filteredItems.map((item) => <RecordCard key={item.user.id} item={item} handleClick={handleUserClick} />)
          ) : (
            <div className='col-span-full flex flex-col items-center justify-center py-12 px-4'>
              <div className='mb-4 p-4 rounded-full bg-gray-100'>
                <FaTrophy className='text-4xl text-gray-400' />
              </div>
              <h3 className='text-xl font-semibold text-gray-800 mb-2'>No Records Yet</h3>
              <p className='text-gray-500 text-center mb-6 max-w-md'>Completed matchups get recorded here.</p>
              <button
                onClick={() => navigate(FRONTEND_URLS.MATCHUPS)}
                className='px-6 py-2 bg-yellow-900 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-200 ease-in-out'
              >
                Go To Matchups
              </button>
            </div>
          ))}
      </div>

      {selectedUser && (
        <div>
          <EventViewCloseButton basePath={FRONTEND_URLS.RECORD} selectItem={() => setSelectedUser(null)} />
          <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
            <RecordStats selectedUser={selectedUser} totalWinnings={totalWinnings} totalBets={totalBets} />
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {filteredMatchups.length > 0 ? (
                filteredMatchups.map((matchup) => (
                  <RecordMatchupCard
                    key={matchup.id}
                    matchup={matchup}
                    handleClick={() => handleMatchupClick(matchup)}
                  />
                ))
              ) : (
                <div className='col-span-full flex flex-col items-center justify-center py-12 px-4'>
                  <div className='mb-4 p-4 rounded-full bg-gray-100'>
                    <FaTrophy className='text-4xl text-gray-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-800 mb-2'>No Completed Matchups</h3>
                  <p className='text-gray-500 text-center max-w-md'>
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

const Record = () => (
  <MatchupsProvider disableWebSockets>
    <RecordProvider>
      <RecordContent />
    </RecordProvider>
  </MatchupsProvider>
);

export default Record;
