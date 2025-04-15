import { useEffect, useRef, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups, MatchupsProvider } from '@/contexts/MatchupsContext';
import MatchupFights from '@/components/MatchupFights';
import FightTabControls from '@/components/FightTabControls';

const MatchupContent = () => {
  const { id } = useParams();
  const { isLoading, isError, matchups, selectMatchup, refetchMatchups, activeFightTab, setActiveFightTab, fights } =
    useMatchups();
  const navigate = useNavigate();
  const [checkingMatchup, setCheckingMatchup] = useState(true);
  const retryCount = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const maxRetries = 2;
    const retryDelay = 500;
    const findMatchup = () => {
      const found = matchups.find((m) => String(m.id) === id);
      if (found) {
        selectMatchup(found);
        setCheckingMatchup(false);
      } else if (!isLoading && retryCount.current < maxRetries) {
        retryCount.current += 1;
        timeoutRef.current = setTimeout(() => {
          refetchMatchups();
          findMatchup();
        }, retryDelay);
      } else if (retryCount.current >= maxRetries) {
        navigate('/dash/matchups', { replace: true });
      }
    };

    findMatchup();

    return () => clearTimeout(timeoutRef.current);
  }, [id, isLoading, navigate]);

  if (checkingMatchup) return <p className='text-center text-gray-500'>{`Looking for matchup ${id}...`}</p>;
  if (isLoading) return <p className='text-center text-gray-500'>Loading matchups...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load matchups.</p>;

  return (
    <div className='grid gap-2 max-w-5xl mx-auto mt-2'>
      <div>
        <FightTabControls
          fights={fights}
          activeFightTab={activeFightTab}
          setActiveFightTab={setActiveFightTab}
          basePath='/dash/matchups'
        />
        <MatchupFights />
      </div>
    </div>
  );
};

const Matchup = () => (
  <MatchupsProvider>
    <MatchupContent />
    <Outlet />
  </MatchupsProvider>
);

export default Matchup;
