import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import CurrentEvent from '@/components/CurrentEvent';
import MatchupCard from '@/components/MatchupCard';
import Spinner from '@/components/Spinner';
import { FRONTEND_URLS } from '@/common/urls';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup } = useMatchups();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(FRONTEND_URLS.MATCHUP_DETAILS(matchup.id));
  };

  const currentMatchups = matchups || [];

  if (isLoading) return <Spinner />;
  if (isError) return <p className='text-center text-rose-500'>Failed to load matchups.</p>;

  return (
    <div className='mx-auto mt-2 grid max-w-3xl gap-2'>
      <div className='pb-4'>
        <CurrentEvent />
      </div>
      {!id && (
        <div className='flex flex-col gap-3'>
          {currentMatchups.length > 0 ? (
            currentMatchups.map((matchup) => (
              <MatchupCard key={matchup.id} matchup={matchup} handleClick={handleClick} />
            ))
          ) : (
            <div className='rounded-xl border border-dashed border-stone-300 bg-white/60 py-14 text-center text-stone-500'>
              <p className='text-lg font-semibold uppercase tracking-wide'>No matchups</p>
              <p className='mt-1 text-sm'>Create one from the event card above.</p>
            </div>
          )}
        </div>
      )}
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
