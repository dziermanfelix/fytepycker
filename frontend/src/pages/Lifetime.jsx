import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLifetime, LifetimeProvider } from '@/contexts/LifetimeContext';
import LifetimeTabControls from '../components/LifetimeTabControls';

const LifetimeContent = () => {
  const navigate = useNavigate();
  const { stats, isLoading, isError, items, selectedUser, setSelectedUser } = useLifetime();

  const handleUserClick = async (user) => {
    setSelectedUser(user);
  };

  const handleMatchupClick = async (matchup) => {
    navigate(`/dash/lifetime/matchups/${matchup.id}`);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading lifetime...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load lifetime.</p>;

  const filteredMatchups = items.flatMap((item) => (item.user.id === selectedUser?.id ? item.matchups : []));

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      {!selectedUser &&
        (items.length > 0 ? (
          items
            .filter((item) => Array.isArray(item.matchups) && item.matchups.length > 0)
            .map((item) => (
              <div
                key={item.user.id}
                className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                onClick={() => handleUserClick(item.user)}
              >
                <div>
                  <div className='flex items-center justify-between space-x-2 w-full'>
                    <div>
                      <p className='ml-2 capitalize'>{item.user.username}</p>
                    </div>
                    <p className='mr-4'>{item.winnings}</p>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <p className='text-center text-gray-500'>No Lifetime.</p>
        ))}

      {selectedUser && (
        <div>
          <LifetimeTabControls setSelectedUser={setSelectedUser} />
          <div className='mb-5 mx-auto mt-2'> stats here... </div>
          <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
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
                      <p className='mr-4'>{matchup.winnings}</p>
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

  return (
    <div className='p-4 rounded-lg'>
      <h2 className='text-xl font-bold mb-4'>Lifetime Head-to-Head</h2>
      // table
      <table className='w-full text-left border-collapse border border-gray-700'>
        <thead>
          <tr className='bg-gray-300'>
            <th className='p-2 border border-gray-700'>Opponent</th>
            <th className='p-2 border border-gray-700'>Wins</th>
            <th className='p-2 border border-gray-700'>Losses</th>
            <th className='p-2 border border-gray-700'>Win %</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ opponent, wins, losses }) => {
            const winPercentage = ((wins / (wins + losses)) * 100).toFixed(1);
            return (
              <tr key={opponent} className='border border-gray-700'>
                <td className='p-2'>{opponent}</td>
                <td className='p-2'>{wins}</td>
                <td className='p-2'>{losses}</td>
                <td className='p-2'>{winPercentage}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      // bar chart
      <div className='mt-6'>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={stats}>
            <XAxis dataKey='opponent' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey='wins' fill='#10b981' name='Wins' />
            <Bar dataKey='losses' fill='#ef4444' name='Losses' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Lifetime = () => (
  <LifetimeProvider>
    <LifetimeContent />
  </LifetimeProvider>
);

export default Lifetime;
