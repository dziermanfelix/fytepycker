import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';
import { getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup, user } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(`/dash/matchups/${matchup.id}`);
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  const currentMatchups = matchups.filter((matchup) => !matchup.event.complete);

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      {!id &&
        (currentMatchups.length > 0 ? (
          currentMatchups.map((matchup) => {
            const otherUser = user.id == matchup?.user_a.id ? matchup?.user_b?.username : matchup?.user_a?.username;
            return (
              <div
                key={matchup.id}
                className='p-4 shadow-lg rounded-lg border border-gray-200 cursor-pointer'
                onClick={() => handleClick(matchup)}
              >
                <div>
                  <div className='flex items-center justify-between space-x-2 w-full'>
                    <p className='ml-2 capitalize'>
                      {matchup?.event?.name} | {matchup?.event?.headline} | {otherUser}
                    </p>
                    <p className={`mr-4 ${getWinningsTextColor(matchup.winnings)}`}>{matchup.winnings}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className='text-center text-gray-500'>No Matchups.</p>
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
