import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import CurrentEvent from '@/components/CurrentEvent';
import MatchupCard from '@/components/MatchupCard';
import { FRONTEND_URLS } from '@/common/urls';

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
            {isLoading &&
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='
                  p-5 rounded-2xl shadow-sm border border-gray-100 
                  bg-white animate-pulse'
                >
                  {/* Header */}
                  <div className='flex justify-between items-center mb-3'>
                    <div className='flex-1'>
                      <div className='h-3 bg-gray-200 rounded w-20 mb-2'></div>
                      <div className='h-5 bg-gray-300 rounded w-24'></div>
                    </div>
                    <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
                  </div>

                  {/* Info grid */}
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <div className='h-3 bg-gray-200 rounded w-16 mb-2'></div>
                      <div className='h-4 bg-gray-300 rounded w-12'></div>
                    </div>
                    <div>
                      <div className='h-3 bg-gray-200 rounded w-20 mb-2'></div>
                      <div className='h-4 bg-gray-300 rounded w-16'></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className='mt-4 flex justify-between'>
                    <div className='h-3 bg-gray-200 rounded w-24'></div>
                    <div className='h-3 bg-gray-200 rounded w-16'></div>
                  </div>
                </div>
              ))}
            {isError && <p className='text-center text-red-500 col-span-full'>Failed to load matchups.</p>}
            {!isLoading &&
              !isError &&
              (currentMatchups.length > 0 ? (
                currentMatchups.map((matchup) => {
                  return <MatchupCard key={matchup.id} matchup={matchup} handleClick={handleClick} />;
                })
              ) : (
                <p className='text-center text-gray-500 col-span-full'>No Matchups.</p>
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
