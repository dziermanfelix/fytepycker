import { useState, useRef, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EventsProvider } from '@/contexts/EventsContext';
import { MatchupsProvider } from '@/contexts/MatchupsContext';
import { ResultsProvider } from '@/contexts/ResultsContext';
import { useAuth } from '@/contexts/AuthContext';
import Events from '@/components/Events';
import Matchups from '@/components/Matchups';
import Results from '@/components/Results';

const Sidebar = ({ activePath, isMobile, setIsSidebarOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'events', label: 'Events', path: '/dash/events' },
    { id: 'matchups', label: 'Matchups', path: '/dash/matchups' },
    { id: 'results', label: 'Results', path: '/dash/results' },
  ];

  const handleNavClick = (id) => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className='bg-white shadow-sm w-50 h-full flex-shrink-0 flex flex-col'>
      <div className='mt-12 flex items-center justify-between'>
        {isMobile && (
          <button onClick={() => setIsSidebarOpen(false)} className='text-gray-400 hover:text-white'>
            ✕
          </button>
        )}
      </div>
      <nav className='mt-6 flex-1 overflow-y-auto'>
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className='mb-2 px-2'>
              <Link to={item.path}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 rounded-md transition-colors ${
                    activePath === item.path ? 'bg-gray-200' : ''
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className='p-4 border-t border-gray-700'>
        <div className='flex items-center'>
          <div className='w-8 h-8 bg-gray-600 rounded-full mr-3'></div>
          <div>
            <p className='font-medium'>{user.username}</p>
            <p className='text-sm text-gray-400'>Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ setIsSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();

  const dropdownOptions = [
    { id: 'profile', label: 'Profile', path: '/dash/profile' },
    { id: 'settings', label: 'Settings', path: '/dash/settings' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleDropdownSelect = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className='bg-white shadow-sm py-4 px-4 sm:px-6 flex justify-between items-center'>
      <div className='flex items-center'>
        <button onClick={() => setIsSidebarOpen(true)} className='mr-4 md:hidden text-gray-500 hover:text-gray-700'>
          ☰
        </button>
      </div>
      <div className='flex items-center space-x-2 sm:space-x-4'>
        <Link to={'/dash/messages'}>
          <button
            onClick={() => handleDropdownSelect()}
            className='bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-500'
          >
            🔔
          </button>
        </Link>
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className='flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full hover:bg-gray-400 focus:outline-none'
          >
            <span className='sr-only'>Open user menu</span>
            <span className='text-xs'>👤</span>
          </button>

          {isDropdownOpen && (
            <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200'>
              <div className='px-4 py-2 text-sm text-gray-700 border-b border-gray-100'>
                <p className='font-medium'>{user.username}</p>
                <p className='text-gray-500 text-xs truncate'>{user.email}</p>
              </div>
              {dropdownOptions.map((item) => (
                <Link key={item.id} to={item.path}>
                  <button
                    onClick={() => handleDropdownSelect()}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                  >
                    <span>{item.label}</span>
                  </button>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const MobileSidebarOverlay = ({ isSidebarOpen, setIsSidebarOpen, children }) => {
  if (!isSidebarOpen) return null;

  return (
    <div className='fixed inset-0 z-40 md:hidden'>
      <div className='fixed inset-0 bg-black bg-opacity-50' onClick={() => setIsSidebarOpen(false)}></div>
      <div className='fixed inset-y-0 left-0 z-50 flex max-w-full'>{children}</div>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <div className='p-6'>
      <Routes>
        <Route
          path='events'
          element={
            <EventsProvider>
              <Events />
            </EventsProvider>
          }
        />
        <Route
          path='matchups'
          element={
            <MatchupsProvider>
              <Matchups />
            </MatchupsProvider>
          }
        />
        <Route
          path='results'
          element={
            <ResultsProvider>
              <Results />
            </ResultsProvider>
          }
        />
        <Route path='settings' element={<div>settings</div>} />
        <Route path='profile' element={<div>profile</div>} />
        <Route path='messages' element={<div>messages</div>} />
        <Route path='*' element={<Navigate to='/dash/events' replace />} />
      </Routes>
    </div>
  );
};

const Dash = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className='h-screen bg-gray-100 flex flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        <div className='hidden md:block'>
          <Sidebar activePath={location.pathname} isMobile={false} />
        </div>

        <div className='flex-1 flex flex-col overflow-hidden'>
          <Header setIsSidebarOpen={setIsSidebarOpen} />
          <main className='flex-1 overflow-y-auto p-4'>
            <DashboardContent />
          </main>
        </div>
      </div>

      <MobileSidebarOverlay isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Sidebar isMobile={true} setIsSidebarOpen={setIsSidebarOpen} />
      </MobileSidebarOverlay>
    </div>
  );
};

export default Dash;
