import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { API_URLS } from '../common/urls';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const fetchEvents = async () => {
  const { data } = await client.get(API_URLS.EVENTS);
  return data;
};

const Events = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeEventTab, setActiveEventTab] = useState('upcoming');
  const [activeFightTab, setActiveFightTab] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const EventCard = ({ event }) => (
    <div
      className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
      onClick={() => setSelectedEvent(event)}
    >
      {event.url && (
        <a href={event.url} target='_blank' rel='noopener noreferrer' className='underline'>
          {event.name}
        </a>
      )}
      <p className='text-gray-600'>{new Date(event.date).toLocaleString()}</p>
      <p className='text-gray-700'>{event.location}</p>
    </div>
  );

  const Fighter = ({ img, name, url }) => (
    <div className='flex-row items-center text-center justify-between'>
      <img src={img} alt={name} className='w-50 h-50 object-contain mb-2' />
      <a href={url} target='_blank' rel='noopener noreferrer' className='underline font-semibold'>
        {name}
      </a>
    </div>
  );

  const FightCards = () => {
    const fightTabs = {
      all: ['main', 'prelim', 'early'],
      main: ['main'],
      prelim: ['prelim'],
      early: ['early'],
    };

    const selectedFights = fightTabs[activeFightTab] || [];

    return (
      <div>
        {selectedFights.map((fightKey) => (
          <FightCard key={fightKey} card={selectedEvent.fights[fightKey]} selectable={activeEventTab === 'upcoming'} />
        ))}
      </div>
    );
  };

  const FightCard = ({ card, selectable }) => {
    const [selectedFighters, setSelectedFighters] = useState({});

    const fighterClicked = (fightId, fighterName) => {
      console.log(`${user.username} selected ${fighterName} for ${fightId}`);
      setSelectedFighters((prev) => {
        if (prev[fightId] === fighterName) {
          const updatedFighters = { ...prev };
          delete updatedFighters[fightId];
          return updatedFighters;
        }
        return {
          ...prev,
          [fightId]: fighterName,
        };
      });
    };

    return (
      <div>
        {card && card.length > 0 && (
          <div>
            <p className='mt-4'>{card[0].card}</p>
            <ul className='space-y-4'>
              {card.map((fight) => (
                <li key={fight.id} className='p-4 bg-white shadow rounded border'>
                  <div className='flex items-center justify-between w-full'>
                    {selectable ? (
                      <button
                        className={`cursor-pointer p-2 rounded transition-colors duration-300 ${
                          selectedFighters[fight.id] === fight.blue_name ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        onClick={(e) => {
                          if (e.target.tagName === 'A') {
                            e.stopPropagation();
                            return;
                          }
                          fighterClicked(fight.id, fight.blue_name);
                        }}
                      >
                        <Fighter img={fight.blue_img} name={fight.blue_name} url={fight.blue_url} />
                      </button>
                    ) : (
                      <div>
                        <Fighter img={fight.blue_img} name={fight.blue_name} url={fight.blue_url} />
                      </div>
                    )}

                    <div className='flex-row text-center justify-between'>
                      <p className='text-gray-600 mb-4'>{fight.weight_class}</p>
                      {fight.winner && fight.method && fight.round && (
                        <p className='text-green-600 font-bold'>
                          Winner: {fight.winner} ({fight.method})
                        </p>
                      )}
                    </div>
                    {selectable ? (
                      <button
                        className={`cursor-pointer p-2 rounded transition-colors duration-300 ${
                          selectedFighters[fight.id] === fight.red_name ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                        onClick={(e) => {
                          if (e.target.tagName === 'A') {
                            e.stopPropagation();
                            return;
                          }
                          fighterClicked(fight.id, fight.red_name);
                        }}
                      >
                        <Fighter img={fight.red_img} name={fight.red_name} url={fight.red_url} />
                      </button>
                    ) : (
                      <div>
                        <Fighter img={fight.red_img} name={fight.red_name} url={fight.red_url} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const upcomingEvents = data?.upcoming || [];
  const pastEvents = data?.past || [];

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return (
    <div className='max-w-4xl mx-auto mt-8'>
      <h1 className='text-2xl font-bold text-center mb-6'>{selectedEvent ? selectedEvent?.name : 'Events'}</h1>
      {!selectedEvent && (
        <div className='flex border-b mb-6'>
          <button
            className={`px-4 py-2 mr-2 cursor-pointer ${
              activeEventTab === 'upcoming' ? 'border-b-2 border-blue-500 font-semibold' : ''
            }`}
            onClick={() => setActiveEventTab('upcoming')}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            className={`px-4 py-2 cursor-pointer ${
              activeEventTab === 'past' ? 'border-b-2 border-blue-500 font-semibold' : ''
            }`}
            onClick={() => setActiveEventTab('past')}
          >
            Past ({pastEvents.length})
          </button>
        </div>
      )}

      {!selectedEvent && activeEventTab === 'upcoming' && (
        <div className='grid gap-4'>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className='text-center text-gray-500'>No events available.</p>
          )}
        </div>
      )}

      {!selectedEvent && activeEventTab === 'past' && (
        <div className='grid gap-4'>
          {pastEvents.length > 0 ? (
            pastEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className='text-center text-gray-500'>No events available.</p>
          )}
        </div>
      )}

      {selectedEvent && (
        <div>
          <div className='flex border-b mb-6'>
            <button
              className={`px-4 py-2 mr-2 cursor-pointer ${
                activeFightTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''
              }`}
              onClick={() => setActiveFightTab('all')}
            >
              All (
              {selectedEvent.fights?.main?.length +
                (selectedEvent.fights?.prelim?.length || 0) +
                (selectedEvent.fights?.early?.length || 0)}
              )
            </button>
            {selectedEvent.fights?.main && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'main' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('main')}
              >
                Main ({selectedEvent.fights.main.length})
              </button>
            )}
            {selectedEvent.fights?.prelim && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'prelim' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('prelim')}
              >
                Prelim ({selectedEvent.fights.prelim.length})
              </button>
            )}
            {selectedEvent.fights?.early && (
              <button
                className={`px-4 py-2 cursor-pointer ${
                  activeFightTab === 'early' ? 'border-b-2 border-blue-500 font-semibold' : ''
                }`}
                onClick={() => setActiveFightTab('early')}
              >
                Early ({selectedEvent.fights.early.length})
              </button>
            )}
            <button
              className={`px-4 py-2 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600`}
              onClick={() => {
                setSelectedEvent(null);
                setActiveFightTab('all');
              }}
            >
              Close
            </button>
          </div>
          <div className='mt-2 mb-2 rounded-lg'>
            <FightCards />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
