import { useNavigate } from 'react-router-dom';
import { useLifetime, LifetimeProvider } from '@/contexts/LifetimeContext';
import LifetimeTabControls from '@/components/LifetimeTabControls';
import { getWinningsTextColor, getWinningsBackgroundColor } from '@/utils/winningsDisplayUtils';

const LifetimeContent = () => {
  const navigate = useNavigate();
  const { isLoading, isError, items, selectedUser, setSelectedUser } = useLifetime();

  const handleUserClick = async (user) => {
    setSelectedUser(user);
  };

  const handleMatchupClick = async (matchup) => {
    sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    navigate(`/dash/lifetime/matchups/${matchup.id}`);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading lifetime...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load lifetime.</p>;

  const filteredMatchups = items.flatMap((item) => (item.user.id === selectedUser?.id ? item.matchups : []));
  const totalWinnings = filteredMatchups.reduce((sum, item) => sum + item.winnings, 0);

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      {!selectedUser &&
        (() => {
          const filteredItems = items.filter((item) => Array.isArray(item.matchups) && item.matchups.length > 0);

          return filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.user.id}
                className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                onClick={() => handleUserClick(item.user)}
              >
                <div className='flex items-center justify-between space-x-2 w-full'>
                  <p className='ml-2'>{item.user.username}</p>
                  <p className={`mr-4 ${getWinningsTextColor(item.winnings)}`}>{item.winnings}</p>
                </div>
              </div>
            ))
          ) : (
            <p className='text-center text-gray-500'>No Lifetime.</p>
          );
        })()}

      {selectedUser && (
        <div>
          <LifetimeTabControls setSelectedUser={setSelectedUser} />
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

const Lifetime = () => (
  <LifetimeProvider>
    <LifetimeContent />
  </LifetimeProvider>
);

export default Lifetime;
