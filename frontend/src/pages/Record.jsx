import { useNavigate } from 'react-router-dom';
import { useRecord, RecordProvider } from '@/contexts/RecordContext';
import RecordTabControls from '@/components/RecordTabControls';
import { getWinningsTextColor, getWinningsBackgroundColor } from '@/utils/winningsDisplayUtils';
import { API_URLS } from '@/common/urls';
import RecordCard from '@/components/RecordCard';

const RecordContent = () => {
  const navigate = useNavigate();
  const { isLoading, isError, items, selectedUser, setSelectedUser } = useRecord();

  const handleUserClick = async (user) => {
    setSelectedUser(user);
  };

  const handleMatchupClick = async (matchup) => {
    sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    navigate(API_URLS.RECORD_DETAILS(matchup.id));
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading record...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load Record.</p>;

  const filteredMatchups = items.flatMap((item) => (item.user.id === selectedUser?.id ? item.matchups : []));
  const totalWinnings = filteredMatchups.reduce((sum, item) => sum + item.winnings, 0);
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
            <div
              className={`flex justify-between p-1 rounded text-center text-lg capitalize ${getWinningsBackgroundColor(
                totalWinnings
              )}`}
            >
              <p className='ml-2'>Stats Vs. {selectedUser.username}</p>
              <p className='mr-2 text-right'>Winnings: {totalWinnings}</p>
            </div>
            {filteredMatchups.length > 0 ? (
              filteredMatchups.map((matchup) => (
                <div
                  key={matchup.id}
                  className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                  onClick={() => handleMatchupClick(matchup)}
                >
                  <div>
                    <div className='flex items-center justify-between space-x-2 w-full'>
                      <p className='ml-2'>
                        {matchup?.event?.name} | {matchup?.event?.headline}
                      </p>
                      <p className={`mr-4 ${getWinningsTextColor(matchup.winnings)}`}>{matchup.winnings}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500'>You have no completed matchups.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Record = () => (
  <RecordProvider>
    <RecordContent />
  </RecordProvider>
);

export default Record;
