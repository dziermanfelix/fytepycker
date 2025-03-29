import { useState, useEffect } from 'react';
import { getFightCards } from '@/utils/fightTabUtils';
import Fighter from '@/components/Fighter';

const Fights = ({ postSelection, selectable, activeFightTab, initialSelections, fights, user }) => {
  const [selections, setSelections] = useState({});
  const fightCards = getFightCards(activeFightTab);

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      const selectionsMap = initialSelections.reduce((acc, selection) => {
        const fight = selection.fight;
        const selectionUser = selection.user;
        const fighter = selection.fighter;
        if (!acc[fight]) {
          acc[fight] = { userFighter: null, otherFighter: null };
        }
        if (selectionUser === user.id) {
          acc[fight].userFighter = fighter;
        } else {
          acc[fight].otherFighter = fighter;
        }
        return acc;
      }, {});
      setSelections(selectionsMap);
    }
  }, [initialSelections]);

  const fighterClicked = async (e, fightId, fighterName) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }

    const prevSelections = selections;
    const cur = prevSelections[fightId] || { userFighter: null, otherFighter: null };
    const userFighter = cur.userFighter;
    const otherFighter = cur.otherFighter;

    if (fighterName === userFighter) {
      setSelections({
        ...prevSelections,
        [fightId]: { ...cur, userFighter: null },
      });
      await postSelection(fightId, fighterName);
    } else if (fighterName === otherFighter) {
      return;
    } else {
      setSelections({
        ...prevSelections,
        [fightId]: { ...cur, userFighter: fighterName },
      });
      await postSelection(fightId, fighterName);
    }
  };

  const determineColor = (fight, fighterName) => {
    if (selections[fight.id]?.userFighter === fighterName) return 'bg-red-500';
    if (selections[fight.id]?.otherFighter === fighterName) return 'bg-blue-500';
    return 'bg-gray-200';
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
          fight?.winner === name && fight?.method && fight?.round && 'border-2 border-green-600'
        } p-2 rounded transition-colors duration-300 ${determineColor(fight, name)}`}
        onClick={
          selectable
            ? (e) => {
                fighterClicked(e, fight?.id, name);
              }
            : null
        }
      >
        <Fighter img={img} name={name} url={url} />
      </button>
    );
  };

  if (fightCards && fightCards.length > 0) {
    return (
      <div>
        {fightCards.map((cardType) => (
          <div key={cardType}>
            <ul className='space-y-4'>
              {fights[cardType]?.map((fight) => (
                <li key={fight?.id} className='p-4 bg-white shadow rounded border'>
                  <div className='flex items-center justify-between w-full'>
                    <FighterButton fight={fight} color='red' />
                    <div className='flex flex-col text-center'>
                      <p className='text-gray-600 mb-4'>{fight?.weight_class}</p>
                      {fight.winner && fight.method && fight.round && (
                        <p className='text-green-600 font-bold'>
                          Round {fight?.round} | {fight?.method}
                        </p>
                      )}
                    </div>
                    <FighterButton fight={fight} color='blue' />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
};

export default Fights;
