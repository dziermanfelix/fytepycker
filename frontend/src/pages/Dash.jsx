import React, { useState } from 'react';
import { EventsProvider } from '@/contexts/EventsContext';
import Events from '@/components/Events';
import Matchups from '@/components/Matchups';

const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'matchups', label: 'Matchups', icon: '🥊' },
  ];

  return (
    <div className='w-60 min-h-screen flex-shrink-0'>
      <div className='bg-white shadow-md border-b border-gray-200'></div>
      <nav className='mt-6'>
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className='mb-2'>
              <button
                onClick={() => setActiveView(item.id)}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-300 rounded-md transition-colors ${
                  activeView === item.id ? 'bg-gray-200' : ''
                }`}
              >
                <span className='mr-3'>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const Header = ({ activeView }) => {
  const titles = {
    events: 'Events',
    matchups: 'Matchups',
  };

  return (
    <header className='bg-white shadow-sm py-4 px-6 flex justify-between items-center'>
      <h1 className='text-xl font-semibold'>{titles[activeView] || 'Dash'}</h1>
      <div className='flex items-center space-x-4'>
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

const DashboardContent = ({ activeView }) => {
  switch (activeView) {
    case 'events':
      return (
        <EventsProvider>
          <Events />
        </EventsProvider>
      );
    case 'matchups':
      return <Matchups />;
    default:
      return <div className='p-6'>Select a view from the sidebar</div>;
  }
};

const Dash = () => {
  const [activeView, setActiveView] = useState('events'); // Default view

  return (
    <div className='flex h-screen '>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header activeView={activeView} />
        <main className='flex-1 overflow-y-auto p-4'>
          <DashboardContent activeView={activeView} />
        </main>
      </div>
    </div>
  );
};

export default Dash;
