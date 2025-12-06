import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { useMatchups } from '@/contexts/MatchupsContext';
import client from '@/api/client';
import { API_URLS, FRONTEND_URLS } from '@/common/urls';

const CreateMatchupModal = ({ isOpen, onClose, selectEvent, selectedEvent, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { users, selectedOpponent, setSelectedOpponent, fetchUsers } = useUsers(user.id);
  const { refetchMatchups } = useMatchups();

  useEffect(() => {
    if (isOpen) {
      try {
        fetchUsers();
      } catch (error) {
        setError('Failed to load users.');
      }
    }
  }, [isOpen]);

  const handleSubmitMatchup = async () => {
    if (!selectedOpponent) {
      setError('Please select an opponent');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await client.post(API_URLS.MATCHUPS, {
        event_id: selectedEvent.id,
        user_a_id: user.id,
        user_b_id: selectedOpponent,
      });

      // Refetch matchups to ensure the new matchup is in the context
      await refetchMatchups();

      navigate(FRONTEND_URLS.MATCHUP_DETAILS(res.data.matchup.id));
      setSelectedOpponent('');
      onClose();
    } catch (error) {
      setError('Failed to create matchup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>Create Matchup</h2>

        {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4'>{error}</div>}

        <div className='mb-4'>
          <label className='block text-gray-700 mb-2'>Select Opponent</label>
          {users.length > 0 ? (
            <select
              className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 hover:cursor-pointer'
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              disabled={isSubmitting}
            >
              {users.map((opponent) => (
                <option key={opponent.id} value={opponent.id}>
                  {opponent.username || opponent.name || opponent.email}
                </option>
              ))}
            </select>
          ) : (
            <p className='text-gray-500'>No users available</p>
          )}
        </div>

        <div className='flex justify-end mt-6'>
          <button
            className='px-4 py-2 mr-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200 hover:cursor-pointer'
            onClick={() => {
              if (selectEvent) selectEvent(null);
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className='px-4 py-2 bg-yellow-900 text-white rounded hover:bg-yellow-800 transition duration-200 disabled:opacity-50 hover:cursor-pointer'
            onClick={handleSubmitMatchup}
            disabled={isSubmitting || !selectedOpponent}
          >
            {isSubmitting ? 'Creating...' : 'Create Matchup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMatchupModal;
