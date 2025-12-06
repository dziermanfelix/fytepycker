import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { MatchupsProvider } from '@/contexts/MatchupsContext';
import { RecordProvider } from '@/contexts/RecordContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dash from '@/pages/Dash';
import Matchups from '@/pages/Matchups';
import Matchup from '@/pages/Matchup';
import Record from '@/pages/Record';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route
            path='/dash/*'
            element={
              <ProtectedRoute>
                <MatchupsProvider>
                  <Dash />
                </MatchupsProvider>
              </ProtectedRoute>
            }
          >
            <Route path='matchups' element={<Matchups />} />
            <Route path='matchups/:id' element={<Matchup basePath='/dash/matchups/' deletable />} />
            <Route
              path='record/*'
              element={
                <RecordProvider>
                  <Record />
                </RecordProvider>
              }
            />
            <Route path='record/matchups/:id' element={<Matchup basePath='/dash/record' />} />
            <Route path='messages' element={<Messages />} />
            <Route path='settings' element={<Settings />} />
            <Route path='profile' element={<Profile />} />
            <Route path='*' element={<Navigate to='/dash/matchups' replace />} />
          </Route>
          <Route path='/' element={<Navigate to='/dash/matchups' replace />} />
          <Route path='*' element={<div>Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
