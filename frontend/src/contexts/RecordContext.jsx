import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecord as useRecordHook, useRecordDetail } from '@/hooks/useRecord';

const RecordContext = createContext({});

export const RecordProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeUserTab, setActiveUserTab] = useState(null);
  const [selectedUser, setSelectedUser] = useState(() => {
    const savedSelectedUser = sessionStorage.getItem('selectedUser');
    return savedSelectedUser ? JSON.parse(savedSelectedUser) : null;
  });

  useEffect(() => {
    if (selectedUser) {
      sessionStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    } else {
      sessionStorage.removeItem('selectedUser');
    }
  }, [selectedUser]);

  const { items, isLoading, isError, refetch } = useRecordHook({ userId: user?.id });
  const {
    detail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
  } = useRecordDetail({ userId: user?.id, opponentId: selectedUser?.id });

  const contextValue = {
    user,

    items,
    selectedUser,
    setSelectedUser,
    selectedMatchups: detail?.matchups || [],

    activeUserTab,
    setActiveUserTab,

    isLoading,
    isError,
    isLoadingDetail,
    isDetailError,
    refetch,
  };

  return <RecordContext.Provider value={contextValue}>{children}</RecordContext.Provider>;
};

export const useRecord = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecord must be used within an RecordProvider');
  }
  return context;
};
