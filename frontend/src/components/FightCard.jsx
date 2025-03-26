import Fighter from '@/components/Fighter';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';

const FightCard = ({ card, matchupId: propMatchupId, selectable: propSelectable }) => {
  const { user } = useAuth();
  const { activeEventTab, matchupId: contextMatchupId } = useEvents();
  const [selections, setSelections] = useState({});
  const matchupId = propMatchupId || contextMatchupId;

  const selectable = propSelectable || activeEventTab === 'upcoming';

  const fetchSelections = async ({ queryKey }) => {
    const [, matchupId] = queryKey;
    if (!matchupId) return {};
    try {
      const { data } = await client.get(API_URLS.SELECTION, { params: { matchup: matchupId } });
      const transformedData = data.reduce((acc, selection) => {
        acc[selection.fight] = selection;
        return acc;
      }, {});
      return transformedData;
    } catch (error) {
      console.error(`Error fetching selections for matchup ${matchupId}:`, error);
      return {};
    }
  };

  const {
    data: initialSelections = {},
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['selections', matchupId],
    queryFn: fetchSelections,
    enabled: !!matchupId,
  });

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      setSelections(initialSelections);
    }
  }, [initialSelections]);

  const fighterClicked = async (e, fightId, fighterName) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }

    let localFighterName = fighterName;
    if (selections[fightId]?.fighter === fighterName) localFighterName = ''; // undo
    setSelections((prevSelections) => ({
      ...prevSelections,
      [fightId]: { fighter: localFighterName, user: user.id },
    }));
    try {
      const { data } = await client.post(API_URLS.SELECTION, {
        matchup: matchupId,
        fight: fightId,
        user: user.id,
        fighter: fighterName,
      });
    } catch (error) {
      console.error('Error saving selection:', error);
      setSelections((prevSelections) => {
        return { ...prevSelections };
      });
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  const determineColor = (fight, fighterName) => {
    let color = 'bg-gray-200';
    if (selections[fight.id]?.fighter == fighterName) {
      if (selections[fight.id]?.user === user.id) {
        color = 'bg-red-500';
      } else {
        color = 'bg-blue-500';
      }
    }
    return color;
  };

  const FighterButton = ({ fight, color }) => {
    let name = fight.blue_name;
    let img = fight.blue_img;
    let url = fight.blue_url;
    if (color === 'red') {
      name = fight.red_name;
      img = fight.red_img;
      url = fight.red_url;
    }
    return (
      <button
        className={`${selectable && 'cursor-pointer'} ${
          fight.winner === name && fight.method && fight.round && 'border-2 border-green-500'
        } p-2 rounded transition-colors duration-300 ${determineColor(fight, name)}`}
        onClick={
          selectable
            ? (e) => {
                fighterClicked(e, fight.id, name);
              }
            : null
        }
      >
        <Fighter img={img} name={name} url={url} />
      </button>
    );
  };

  if (card && card.length > 0) {
    return (
      <div>
        <div>
          <p className='mt-4'>{card[0].card}</p>
          <ul className='space-y-4'>
            {card.map((fight) => {
              return (
                <li key={fight.id} className='p-4 bg-white shadow rounded border'>
                  <div className='flex items-center justify-between w-full'>
                    <FighterButton fight={fight} color='red' />
                    <div className='flex-row text-center justify-between'>
                      <p className='text-gray-600 mb-4'>{fight.weight_class}</p>
                      {fight.winner && fight.method && fight.round && (
                        <p className='text-green-600 font-bold'>
                          Winner: {fight.winner} ({fight.method})
                        </p>
                      )}
                    </div>
                    <FighterButton fight={fight} color='blue' />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
};

export default FightCard;
