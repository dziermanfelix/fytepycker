import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import CurrentEvent from '@/components/CurrentEvent';
import MatchupCard from '@/components/MatchupCard';
import { API_URLS } from '@/common/urls';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(API_URLS.MATCHUP_DETAILS(matchup.id));
  };

  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  const currentMatchups = matchups.filter((matchup) => !matchup.event.complete);

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      <div className='pb-4'>
        <CurrentEvent />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {!id &&
          (currentMatchups.length > 0 ? (
            currentMatchups.map((matchup) => {
              return <MatchupCard key={matchup.id} matchup={matchup} handleClick={handleClick} />;
            })
          ) : (
            <p className='text-center text-gray-500'>No Matchups.</p>
          ))}
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
