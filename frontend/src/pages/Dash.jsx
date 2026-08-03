import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { RxHamburgerMenu } from 'react-icons/rx';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';
import { API_URLS, FRONTEND_URLS } from '@/common/urls';

const ACCOUNT_LINKS = [
  { id: 'profile', label: 'Profile', path: '/dash/profile' },
  { id: 'settings', label: 'Settings', path: '/dash/settings' },
];

const Sidebar = ({ activePath, isMobile, setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [version, setVersion] = useState('');

  const navItems = [
    { id: 'matchups', label: 'Matchups', path: '/dash/matchups' },
    { id: 'record', label: 'Record', path: '/dash/record' },
  ];

  useEffect(() => {
    if (!isMobile) return;
    const getVersion = async () => {
      try {
        const { data } = await client.get(API_URLS.VERSION);
        setVersion(data.version);
      } catch {
        setVersion('');
      }
    };
    getVersion();
  }, [isMobile]);

  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    handleNavClick();
    logout();
  };

  return (
    <div className='flex h-full w-75 flex-shrink-0 flex-col bg-white shadow-sm'>
      {isMobile && (
        <div className='flex items-center justify-end px-4 pt-6 pb-2'>
          <button onClick={() => setIsSidebarOpen(false)} className='danger-btn'>
            <IoMdClose />
          </button>
        </div>
      )}
      <nav className={`flex-1 overflow-y-auto ${isMobile ? 'mt-2' : ''}`}>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <Link to={item.path}>
                <button
                  onClick={handleNavClick}
                  className={`flex w-full items-center px-4 py-3 transition-colors hover:bg-gray-200 ${
                    activePath === item.path || activePath.startsWith(`${item.path}/`) ? 'bg-gray-100' : ''
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {isMobile && (
        <div className='border-t border-stone-200 pb-[max(1.5rem,env(safe-area-inset-bottom))]'>
          <div className='px-4 py-3 text-sm text-stone-700'>
            <p className='font-medium'>{user.username}</p>
            <p className='truncate text-xs text-stone-500'>{user.email}</p>
            {version && <p className='mt-1 text-xs text-stone-400'>version {version}</p>}
          </div>
          <ul>
            {ACCOUNT_LINKS.map((item) => (
              <li key={item.id}>
                <Link to={item.path}>
                  <button
                    onClick={handleNavClick}
                    className={`flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-gray-200 ${
                      activePath === item.path ? 'bg-gray-100' : ''
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className='flex w-full items-center px-4 py-3 text-left capitalize text-red-600 transition-colors hover:bg-gray-200'
              >
                log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const Header = ({ setIsSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [version, setVersion] = useState('');
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const getVersion = async () => {
      try {
        const { data } = await client.get(API_URLS.VERSION);
        setVersion(data.version);
      } catch {
        setVersion('');
      }
    };
    getVersion();
  }, []);

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

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <header className='relative flex h-14 shrink-0 items-center justify-between bg-white px-4 shadow-sm sm:px-6'>
      <div className='flex w-8 items-center md:w-auto'>
        <button onClick={() => setIsSidebarOpen(true)} className='text-gray-500 hover:text-gray-700 md:hidden'>
          <RxHamburgerMenu />
        </button>
        <Link
          to={FRONTEND_URLS.MATCHUPS}
          className='hidden items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40 md:flex'
          aria-label='Fytepycker home'
        >
          <img src='/icons/icon-192.png' alt='' className='h-8 w-8 rounded object-cover' />
          <span className='text-sm font-bold uppercase tracking-wide text-stone-800'>fytepycker</span>
        </Link>
      </div>

      <Link
        to={FRONTEND_URLS.MATCHUPS}
        className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-800/40 md:hidden'
        aria-label='Fytepycker home'
      >
        <img src='/icons/icon-192.png' alt='' className='h-8 w-8 rounded object-cover' />
        <span className='text-sm font-bold uppercase tracking-wide text-stone-800'>fytepycker</span>
      </Link>

      <div className='hidden items-center md:flex'>
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((open) => !open)}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 focus:outline-none'
          >
            <span className='sr-only'>Open user menu</span>
            <span className='text-xs'>
              <FaUser />
            </span>
          </button>

          {isDropdownOpen && (
            <div className='absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg'>
              <div className='border-b border-gray-100 px-4 py-2 text-sm capitalize text-gray-700'>
                <p className='font-medium'>fytepycker</p>
                <p className='truncate text-xs text-gray-500'>version {version}</p>
              </div>
              <div className='border-b border-gray-100 px-4 py-2 text-sm text-gray-700'>
                <p className='font-medium'>{user.username}</p>
                <p className='truncate text-xs text-gray-500'>{user.email}</p>
              </div>
              {ACCOUNT_LINKS.map((item) => (
                <Link key={item.id} to={item.path}>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <span>{item.label}</span>
                  </button>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className='block w-full px-4 py-2 text-left text-sm capitalize text-red-600 hover:bg-gray-100'
              >
                log out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='w-8 md:hidden' aria-hidden='true' />
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

const Dash = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className='app-shell flex flex-col bg-stone-100'>
      <Header setIsSidebarOpen={setIsSidebarOpen} />

      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <div className='hidden md:block'>
          <Sidebar activePath={location.pathname} isMobile={false} />
        </div>

        <main className='min-w-0 flex-1 overflow-y-auto p-3 sm:p-6'>
          <Outlet />
        </main>
      </div>

      <MobileSidebarOverlay isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Sidebar activePath={location.pathname} isMobile={true} setIsSidebarOpen={setIsSidebarOpen} />
      </MobileSidebarOverlay>
    </div>
  );
};

export default Dash;
