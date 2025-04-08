import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(`/dash/matchups/${matchup.id}`);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      {!id &&
        (matchups.length > 0 ? (
          matchups.map((matchup) => (
            <div
              key={matchup.id}
              className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
              onClick={() => handleClick(matchup)}
            >
              <div>
                <div className='flex items-center space-x-2'>
                  <p className=''>
                    {matchup?.event?.name} | {matchup?.event?.headline}
                  </p>
                </div>
                <p className='capitalize text-gray-600'>versus {matchup?.user_b?.username ?? 'No user data.'}</p>
              </div>
            </div>
          ))
        ) : (
          <p className='text-center text-gray-500'>You have no matchups to display. You are a loser.</p>
        ))}
    </div>
  );
};

const Matchups = () => (
  <MatchupsProvider>
    <MatchupsContent />
    <Outlet />
  </MatchupsProvider>
);

export default Matchups;
