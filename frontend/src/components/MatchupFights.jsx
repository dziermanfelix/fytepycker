import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useMatchups } from '@/contexts/MatchupsContext';
import SelectableFights from '@/components/SelectableFights';

const MatchupFights = () => {
  const {
    user,
    selectedMatchup,
    selections: initialSelections,
    refetchSelections,
    isLoading,
    isError,
    activeFightTab,
    fights,
    ws,
  } = useMatchups();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const postSelection = async (fightId, fighterName) => {
    try {
      const { data } = await client.post(API_URLS.SELECTIONS, {
        matchup: selectedMatchup?.id,
        fight: fightId,
        user: user.id,
        fighter: fighterName,
      });
    } catch (error) {}
  };

  const deleteMatchup = () => {
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
      navigate('/dash/events');
    } catch (error) {
      setError('Failed to delete matchup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <div className='relative'>
      <SelectableFights
        selectedMatchup={selectedMatchup}
        postSelection={postSelection}
        activeFightTab={activeFightTab}
        user={user}
        fights={fights}
        initialSelections={initialSelections}
        refetchSelections={refetchSelections}
        ws={ws}
      />
      <div>
        <button
          className='mt-2 mb-2 px-6 py-2 bg-yellow-900 font-semibold rounded-lg shadow-md hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out'
          onClick={deleteMatchup}
        >
          Delete Matchup
        </button>
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

export default MatchupFights;
