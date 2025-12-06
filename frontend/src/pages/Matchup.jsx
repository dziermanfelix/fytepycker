import { useEffect, useRef, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import FightTabControls from '@/components/FightTabControls';
import SelectableFights from '@/components/SelectableFights';
import { getWinningsBackgroundColor } from '@/utils/winningsDisplayUtils';

const MatchupContent = ({ basePath, deletable }) => {
  const { id } = useParams();
  const {
    isLoading,
    isError,
    matchups,
    selectMatchup,
    selectedMatchup,
    refetchMatchups,
    activeFightTab,
    setActiveFightTab,
    fights,
    selections,
  } = useMatchups();
  const navigate = useNavigate();
  const [checkingMatchup, setCheckingMatchup] = useState(true);
  const retryCount = useRef(0);
  const timeoutRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
  }, [id, isLoading, navigate, matchups]);

  const deleteMatchupClicked = () => {
    setIsModalOpen(true);
  };

  const handleDeleteMatchup = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await client.delete(API_URLS.MATCHUPS, {
        data: {
          event_id: selectedMatchup?.event?.id,
          user_a_id: selectedMatchup?.user_a?.id,
          user_b_id: selectedMatchup?.user_b?.id,
        },
      });

      setIsModalOpen(false);
      navigate('/dash/matchups');
    } catch (error) {
      setError('Failed to delete matchup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const WinningsBanner = () => {
    const winnings = selectedMatchup.winnings;
    const displayBanner = selections.every((s) => s.confirmed) || selectedMatchup.event.complete;

    if (!displayBanner) return null;

    return (
      <div
        className={`sticky top-0 z-30 px-4 py-2 rounded-full 
                    text-sm font-semibold shadow text-white
                    backdrop-blur-lg bg-opacity-90 ${getWinningsBackgroundColor(winnings)}`}
      >
        <span className='uppercase tracking-wide text-xs opacity-80 mr-2'>
          {winnings >= 0 ? 'Winnings' : 'Losings'}
        </span>
        <span className='text-lg'>{winnings}</span>
      </div>
    );
  };

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
          basePath={basePath}
        />
        <WinningsBanner />
        <SelectableFights />
        {deletable && (
          <div>
            <button
              className='mt-2 mb-2 px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
              onClick={deleteMatchupClicked}
            >
              Delete Matchup
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4'>Confirm Delete Matchup</h2>

            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4'>{error}</div>
            )}

            <div className='flex justify-start mt-6'>
              <button
                className='px-4 py-2 mr-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200'
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className='px-4 py-2 bg-yellow-900 text-white rounded hover:bg-yellow-800 transition duration-200 disabled:opacity-50'
                onClick={handleDeleteMatchup}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Matchup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Matchup = ({ basePath, deletable }) => (
  <>
    <MatchupContent basePath={basePath} deletable={deletable} />
    <Outlet />
  </>
);

export default Matchup;
