import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Matchups = () => {
  const { user } = useAuth();

  const fetchMatchups = async () => {
    const { data } = await client.get(API_URLS.MATCHUP);
    return data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matchups'],
    queryFn: fetchMatchups,
  });

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  console.log(`data = ${JSON.stringify(data)}`);

  function handleClick(matchup) {}

  return (
    <div className='grid gap-4'>
      <p>matchups</p>
      {data.length > 0 ? (
        data.map((matchup) => (
          <div
            key={matchup.id}
            className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
            onClick={() => handleClick(matchup)}
          >
            <p className='text-gray-600'>{matchup.creator}</p>
            <p className='text-gray-700'>{matchup.opponent}</p>
          </div>
        ))
      ) : (
        <p className='text-center text-gray-500'>No matchups available.</p>
      )}
    </div>
  );
};

export const useEventsContext = () => useContext(EventsContext);

export default Matchups;
