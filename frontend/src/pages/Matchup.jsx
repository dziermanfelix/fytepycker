import { useEffect, useRef, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMatchups } from '@/contexts/MatchupsContext';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';
import { API_URLS, FRONTEND_URLS } from '@/common/urls';
import EventViewCloseButton from '@/components/EventViewCloseButton';
import SelectableFights from '@/components/SelectableFights';
import Spinner from '@/components/Spinner';
import { formatWinnings, getWinningsTextColor } from '@/utils/winningsDisplayUtils';

const getFirstFight = (event) => Object.values(event?.fights || {}).flat()[0];

const hasFighterNames = (event) => {
  const fight = getFirstFight(event);
  return Boolean(fight?.red_name || fight?.blue_name);
};

const findCachedMatchup = (matchupId, selectedMatchup, matchupsList) => {
  if (selectedMatchup?.id == matchupId) return selectedMatchup;
  return matchupsList?.find((matchup) => String(matchup.id) === String(matchupId)) ?? null;
};

const fetchEventWithFights = async (eventId) => {
  const { data } = await client.get(`${API_URLS.EVENTS}${eventId}/`);
  return data.event;
};

const fetchMatchupById = async (matchupId) => {
  const { data } = await client.get(API_URLS.MATCHUPS, { params: { id: matchupId } });
  return data?.[0] ?? null;
};

const MatchupContent = ({ basePath, deletable }) => {
  const { id } = useParams();
  const { matchups, selectedMatchup, selectMatchup, clearSelectedMatchup, refetchMatchups, selections } = useMatchups();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingMatchup, setCheckingMatchup] = useState(true);
  const [isError, setIsError] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const matchupsRef = useRef(matchups);
  const selectedMatchupRef = useRef(selectedMatchup);
  matchupsRef.current = matchups;
  selectedMatchupRef.current = selectedMatchup;

  const backLabel = basePath?.includes('record') ? 'Record' : 'Matchups';
  const otherUser =
    user?.id == selectedMatchup?.user_a?.id ? selectedMatchup?.user_b?.username : selectedMatchup?.user_a?.username;

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const loadMatchup = async () => {
      setCheckingMatchup(true);
      setIsError(false);
      try {
        const cachedMatchup = findCachedMatchup(id, selectedMatchupRef.current, matchupsRef.current);

        if (cachedMatchup && hasFighterNames(cachedMatchup.event)) {
          if (cancelled) return;
          selectMatchup(cachedMatchup);
          setCheckingMatchup(false);
          return;
        }

        if (cachedMatchup?.event?.id) {
          const eventWithFights = await fetchEventWithFights(cachedMatchup.event.id);
          if (cancelled) return;
          selectMatchup({ ...cachedMatchup, event: eventWithFights });
          setCheckingMatchup(false);
          return;
        }

        const matchup = await fetchMatchupById(id);
        if (cancelled) return;
        if (!matchup) {
          navigate(basePath?.includes('record') ? FRONTEND_URLS.RECORD : FRONTEND_URLS.MATCHUPS, { replace: true });
          return;
        }
        selectMatchup(matchup);
        setCheckingMatchup(false);
      } catch {
        if (cancelled) return;
        setIsError(true);
        setCheckingMatchup(false);
      }
    };

    loadMatchup();

    return () => {
      cancelled = true;
      clearSelectedMatchup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deleteMatchupClicked = () => {
    setIsModalOpen(true);
  };

  const handleDeleteMatchup = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await client.delete(API_URLS.MATCHUPS, {
        data: {
          event_id: selectedMatchup?.event?.id,
          user_a_id: selectedMatchup?.user_a?.id,
          user_b_id: selectedMatchup?.user_b?.id,
        },
      });

      setIsModalOpen(false);
      await refetchMatchups();
      navigate(FRONTEND_URLS.MATCHUPS);
    } catch (error) {
      setError('Failed to delete matchup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showResult = selectedMatchup && (selections.every((s) => s.confirmed) || selectedMatchup.event.complete);

  if (checkingMatchup) return <Spinner />;
  if (isError) return <p className='text-center text-rose-500'>Failed to load matchup.</p>;

  return (
    <div className='mx-auto mt-2 grid max-w-3xl gap-3'>
      <div className='overflow-hidden rounded-xl border border-stone-800 bg-stone-900'>
        <div className='flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
          <EventViewCloseButton basePath={basePath} label={backLabel} variant='dark' />
          {selectedMatchup?.event?.name && (
            <p className='truncate text-sm text-stone-400 sm:text-right'>{selectedMatchup.event.name}</p>
          )}
        </div>

        <div className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
          <div className='flex min-w-0 items-center gap-3 sm:gap-4'>
            <div className='min-w-0 text-right'>
              <p className='text-xs text-stone-400'>You</p>
              <p className='truncate text-lg font-bold uppercase text-white'>{user?.username}</p>
            </div>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold tracking-wider text-white'>
              VS
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-stone-400'>Opponent</p>
              <p className='truncate text-lg font-bold uppercase text-white'>{otherUser}</p>
            </div>
          </div>

          {showResult && (
            <div className='sm:text-right'>
              <p className='text-xs font-medium uppercase tracking-wide text-stone-400'>Result</p>
              <p className={` text-3xl font-bold tabular-nums ${getWinningsTextColor(selectedMatchup.winnings)}`}>
                {formatWinnings(selectedMatchup.winnings)}
              </p>
            </div>
          )}
        </div>
      </div>

      <SelectableFights />

      {deletable && (
        <div>
          <button className='danger-btn' onClick={deleteMatchupClicked}>
            Delete Matchup
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6'>
            <h2 className='mb-4 text-xl font-bold'>Confirm Delete Matchup</h2>

            {error && (
              <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-2 text-red-700'>{error}</div>
            )}

            <div className='mt-4 flex justify-start gap-2'>
              <button
                className='danger-btn'
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className='submit-btn inline-flex items-center justify-center min-w-24'
                onClick={handleDeleteMatchup}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner size='sm' className='border-white/30 border-t-white' /> : 'Delete'}
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
