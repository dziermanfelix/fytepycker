import { useState } from 'react';
import Fighter from '@/components/Fighter';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEventsContext } from '@/components/Events';

const FightCard = ({ card, selectable }) => {
  const [selectedFighters, setSelectedFighters] = useState({});
  const { user, matchup } = useEventsContext();

  const fighterClicked = async (fightId, fighterName) => {
    console.log(`${user.username} selected ${fighterName} for fight ${fightId} in matchup ...`);
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
    const { data } = await client.post(API_URLS.SELECTION, {
      matchup: matchup,
      fight: fightId,
      user: user.id,
      fighter: fighterName,
    });
    console.log(`data = ${JSON.stringify(data)}`);
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

export default FightCard;
