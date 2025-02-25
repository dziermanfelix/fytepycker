import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FRONTEND_URLS } from '../common/urls';

const ProtectedRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={FRONTEND_URLS.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
