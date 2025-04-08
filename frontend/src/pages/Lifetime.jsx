import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLifetime, LifetimeProvider } from '@/contexts/LifetimeContext';

const LifetimeContent = () => {
  const { stats, isLoading, isError } = useLifetime();

  if (isLoading) return <p className='text-center text-gray-500'>Loading lifetime...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load lifetime.</p>;

  return (
    <div className='p-4 rounded-lg'>
      <h2 className='text-xl font-bold mb-4'>Lifetime Head-to-Head</h2>

      {/* Table View */}
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

      {/* Bar Chart */}
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
