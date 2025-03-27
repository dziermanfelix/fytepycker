import React, { useState } from 'react';
import { EventsProvider } from '@/contexts/EventsContext';
import { MatchupsProvider } from '@/contexts/MatchupsContext';
import Events from '@/components/Events';
import Matchups from '@/components/Matchups';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ activeView, setActiveView, isMobile, setIsSidebarOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'matchups', label: 'Matchups', icon: '🥊' },
  ];

  const handleNavClick = (id) => {
    setActiveView(id);
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
              <button
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-400 rounded-md transition-colors ${
                  activeView === item.id ? 'bg-gray-300' : ''
                }`}
              >
                <span className='mr-3'>{item.icon}</span>
                <span>{item.label}</span>
              </button>
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

const Header = ({ activeView, setIsSidebarOpen }) => {
  const titles = {
    events: 'Events',
    matchups: 'Matchups',
  };

  return (
    <header className='bg-white shadow-sm py-4 px-4 sm:px-6 flex justify-between items-center'>
      <div className='flex items-center'>
        <button onClick={() => setIsSidebarOpen(true)} className='mr-4 md:hidden text-gray-500 hover:text-gray-700'>
          ☰
        </button>
        <h1 className='text-xl font-semibold'>{titles[activeView] || 'Dashboard'}</h1>
      </div>
      <div className='flex items-center space-x-2 sm:space-x-4'>
        <button className='bg-gray-100 hover:bg-gray-200 p-2 rounded-full'>
          <span className='text-gray-500'>🔍</span>
        </button>
        <button className='bg-gray-100 hover:bg-gray-200 p-2 rounded-full'>
          <span className='text-gray-500'>🔔</span>
        </button>
        <div className='w-8 h-8 bg-gray-300 rounded-full'></div>
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

const DashboardContent = ({ activeView }) => {
  switch (activeView) {
    case 'events':
      return (
        <EventsProvider>
          <Events />
        </EventsProvider>
      );
    case 'matchups':
      return (
        <MatchupsProvider>
          <Matchups />
        </MatchupsProvider>
      );
    default:
      return <div className='p-6'>Select a view from the sidebar</div>;
  }
};

const Dash = () => {
  const [activeView, setActiveView] = useState('events');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className='h-screen bg-gray-100 flex flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        <div className='hidden md:block'>
          <Sidebar activeView={activeView} setActiveView={setActiveView} isMobile={false} />
        </div>

        <div className='flex-1 flex flex-col overflow-hidden'>
          <Header activeView={activeView} setIsSidebarOpen={setIsSidebarOpen} />
          <main className='flex-1 overflow-y-auto p-4'>
            <DashboardContent activeView={activeView} />
          </main>
        </div>
      </div>

      <MobileSidebarOverlay isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isMobile={true}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </MobileSidebarOverlay>
    </div>
  );
};

export default Dash;
