import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';

const MatchupsContent = () => {
  const { isLoading, isError, matchups } = useMatchups();

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  function handleClick(matchup) {}

  return (
    <div className='grid gap-4 max-w-5xl mx-auto mt-8'>
      {matchups.length > 0 ? (
        matchups.map((matchup) => (
          <div
            key={matchup.id}
            className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
            onClick={() => handleClick(matchup)}
          >
            <p className='text-gray-600'>{matchup.user_a}</p>
            <p className='text-gray-600'>{matchup.user_b}</p>
          </div>
        ))
      ) : (
        <p className='text-center text-gray-500'>No matchups available.</p>
      )}
    </div>
  );
};

const Matchups = () => (
  <MatchupsProvider>
    <MatchupsContent />
  </MatchupsProvider>
);

export default Matchups;
