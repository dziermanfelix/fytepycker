import { Navigate } from 'react-router-dom';
import { FRONTEND_URLS } from '@/common/urls';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (user) {
    return <Navigate to={FRONTEND_URLS.MATCHUPS} replace />;
  }

  return children;
};

export default PublicRoute;
