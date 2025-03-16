import Fighter from '@/components/Fighter';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEventsContext } from '@/components/Events';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

const FightCard = ({ card, selectable }) => {
  const { user, matchup } = useEventsContext();
  const [selections, setSelections] = useState({});

  const fetchSelections = async ({ queryKey }) => {
    const [, matchup] = queryKey;
    if (!matchup) return {};
    try {
      const { data } = await client.get(API_URLS.SELECTION, { params: { matchup } });
      const transformedData = data.reduce((acc, selection) => {
        acc[selection.fight] = selection;
        return acc;
      }, {});
      return transformedData;
    } catch (error) {
      console.error(`Error fetching selections for matchup ${matchup}:`, error);
      return {};
    }
  };

  const {
    data: initialSelections = {},
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['selections', matchup],
    queryFn: fetchSelections,
    enabled: !!matchup,
  });

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      setSelections(initialSelections);
    }
  }, [initialSelections]);

  const fighterClicked = async (fightId, fighterName) => {
    let localFighterName = fighterName;
    if (selections[fightId]?.fighter === fighterName) localFighterName = ''; // undo
    setSelections((prevSelections) => ({
      ...prevSelections,
      [fightId]: { fighter: localFighterName, user: user.id },
    }));
    try {
      const { data } = await client.post(API_URLS.SELECTION, {
        matchup: matchup,
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
                    {selectable ? (
                      <button
                        className={`cursor-pointer p-2 rounded transition-colors duration-300 ${determineColor(
                          fight,
                          fight.blue_name
                        )}`}
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
                        className={`cursor-pointer p-2 rounded transition-colors duration-300 ${determineColor(
                          fight,
                          fight.red_name
                        )}`}
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
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
};

export default FightCard;
