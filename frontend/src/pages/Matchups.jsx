import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import { EventsProvider, useEvents } from '@/contexts/EventsContext';
import CurrentEvent from '@/components/CurrentEvent';
import MatchupCard from '@/components/MatchupCard';
import Spinner from '@/components/Spinner';
import { FRONTEND_URLS } from '@/common/urls';

const MatchupsContent = () => {
  const { id } = useParams();
  const { isLoading: isLoadingMatchups, isError, matchups, selectMatchup } = useMatchups();
  const { isLoading: isLoadingEvents, selectedEvent } = useEvents();
  const navigate = useNavigate();

  const handleClick = async (matchup) => {
    selectMatchup(matchup);
    navigate(FRONTEND_URLS.MATCHUP_DETAILS(matchup.id));
  };

  const currentMatchups = matchups || [];
  const browsingEvent = Boolean(selectedEvent);

  if (isLoadingMatchups || isLoadingEvents) return <Spinner />;
  if (isError) return <p className='text-center text-rose-500'>Failed to load matchups.</p>;

  return (
    <div className='mx-auto mt-2 grid w-full min-w-0 max-w-3xl gap-2'>
      <div className='min-w-0 pb-2'>
        <CurrentEvent />
      </div>
      {!id && !browsingEvent && (
        <div className='flex min-w-0 flex-col gap-2'>
          {currentMatchups.length > 0 ? (
            currentMatchups.map((matchup) => (
              <MatchupCard key={matchup.id} matchup={matchup} handleClick={handleClick} />
            ))
          ) : (
            <div className='rounded-lg border border-dashed border-stone-300 bg-white/60 px-3 py-10 text-center text-stone-500'>
              <p className='text-base font-semibold uppercase tracking-wide'>No matchups</p>
              <p className='mt-1 text-sm'>Create one from the event card above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Matchups = () => (
  <EventsProvider>
    <MatchupsContent />
    <Outlet />
  </EventsProvider>
);

export default Matchups;
