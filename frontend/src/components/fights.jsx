import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

function UpcomingFights() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fights'],
    queryFn: () => client.get('/fights/').then((res) => res.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((fight) => (
        <div key={fight.id}>
          {fight.fighter1} vs {fight.fighter2}
        </div>
      ))}
    </div>
  );
}
