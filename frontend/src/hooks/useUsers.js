import { useState } from 'react';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';

export const useUsers = (currentUserId, eventId) => {
  const [users, setUsers] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await client.get(API_URLS.AVAILABLE_USERS, {
        params: { user_id: currentUserId, event_id: eventId },
      });
      const filteredUsers = data.filter((u) => u.id !== currentUserId);
      setUsers(filteredUsers);
      if (filteredUsers.length > 0) {
        setSelectedOpponent(filteredUsers[0].id);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  return {
    users,
    selectedOpponent,
    setSelectedOpponent,
    error,
    fetchUsers,
  };
};
