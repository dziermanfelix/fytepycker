import { Navigate } from 'react-router-dom';
import { FRONTEND_URLS } from '@/common/urls';
import { useAuth } from '@/contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={FRONTEND_URLS.MATCHUPS} replace />;
  }

  return children;
};

export default PublicRoute;
