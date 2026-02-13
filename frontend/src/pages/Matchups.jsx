import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import CurrentEvent from '@/components/CurrentEvent';
import MatchupCard from '@/components/MatchupCard';
import { FRONTEND_URLS } from '@/common/urls';
import LoadingCards from '@/components/LoadingCards';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(FRONTEND_URLS.MATCHUP_DETAILS(matchup.id));
  };

  const currentMatchups = matchups?.filter((matchup) => !matchup.event.complete) || [];

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      <div className='pb-4'>
        <CurrentEvent />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {!id && (
          <>
            {isLoading && <LoadingCards />}
            {isError && <p className='text-center text-red-500 col-span-full'>Failed to load matchups.</p>}
            {!isLoading &&
              !isError &&
              (currentMatchups.length > 0 ? (
                currentMatchups.map((matchup) => {
                  return <MatchupCard key={matchup.id} matchup={matchup} handleClick={handleClick} />;
                })
              ) : (
                <div>
                  <LoadingCards count={1} />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
};

const Matchups = () => (
  <>
    <MatchupsContent />
    <Outlet />
  </>
);

export default Matchups;
