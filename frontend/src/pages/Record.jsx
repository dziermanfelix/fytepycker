import { useNavigate } from 'react-router-dom';
import { useRecord, RecordProvider } from '@/contexts/RecordContext';
import RecordTabControls from '@/components/RecordTabControls';
import { FRONTEND_URLS } from '@/common/urls';
import RecordCard from '@/components/RecordCard';
import { MatchupsProvider } from '@/contexts/MatchupsContext';
import RecordMatchupCard from '@/components/RecordMatchupCard';
import RecordStats from '@/components/RecordStats';
import LoadingCards from '@/components/LoadingCards';

const RecordContent = () => {
  const navigate = useNavigate();
  const { isLoading, isError, items, selectedUser, setSelectedUser } = useRecord();

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
            <p className='text-center text-gray-500'>No Record.</p>
          ))}
      </div>

      {selectedUser && (
        <div>
          <RecordTabControls setSelectedUser={setSelectedUser} />
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
                <p className='text-center text-gray-500'>You have no completed matchups.</p>
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
