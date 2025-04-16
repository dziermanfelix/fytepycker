import { useRef, useEffect } from 'react';
import { getFightCards } from '@/utils/fightTabUtils';

const Fights = ({ activeFightTab, fights, user, selections, fighterClicked, readyFight }) => {
  const fightRefs = useRef({});

  useEffect(() => {
    if (readyFight && fightRefs.current[readyFight]) {
      fightRefs.current[readyFight].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [readyFight]);

  const fightCards = getFightCards(activeFightTab);

  const Fighter = ({ img, name, url }) => (
    <div className='flex-row items-center text-center justify-between'>
      <img src={img} alt={name} className='w-50 h-50 object-contain mb-2' />
      <a href={url} target='_blank' rel='noopener noreferrer' className='underline font-semibold'>
        {name}
      </a>
    </div>
  );

  const FighterButton = ({ fight, selection, color }) => {
    let name = fight.blue_name;
    let img = fight.blue_img;
    let url = fight.blue_url;
    if (color === 'red') {
      name = fight.red_name;
      img = fight.red_img;
      url = fight.red_url;
    }
    const selectable =
      !fight.winner &&
      selection?.ready &&
      (selection?.dibs === user?.id || selection?.otherSelection) &&
      selection?.otherSelection !== name &&
      !selection?.confirmed;
    return (
      <button
        className={`${
          fight?.winner === name && 'border-6 border-yellow-500'
        } p-2 rounded transition-colors duration-300 ${selectable && 'cursor-pointer'} ${
          selections && determineColor(fight, name)
        }`}
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

  const determineColor = (fight, fighterName) => {
    if (selections[fight.id]?.userSelection === fighterName) return 'bg-red-500';
    if (selections[fight.id]?.otherSelection === fighterName) return 'bg-blue-500';
    return 'bg-gray-200';
  };

  const InfoSection = ({ fight }) => {
    return (
      <div className='flex flex-col text-center'>
        <p className='text-gray-600 mb-4'>{fight?.weight_class}</p>
      </div>
    );
  };

  const SelectionStatusSection = ({ fight }) => {
    let selection;
    let selectionStatusText;
    if (user && selections) {
      selection = selections[fight.id];
      if (!selection || fight.winner) return null;
      if (selection.confirmed) {
        selectionStatusText = 'Selections Confirmed.';
      } else if (selection.ready) {
        if (selection.dibs == user?.id && !selection.userSelection) {
          selectionStatusText = 'Select a Fighter!';
        } else if (selection.dibs != user?.id && !selection.userSelection && selection.otherSelection) {
          selectionStatusText = 'Confirm Your Selection...';
        } else {
          selectionStatusText = 'Waiting For Opponent...';
        }
      } else {
        selectionStatusText = '';
      }
    }
    return (
      <div className='flex flex-col text-center'>
        {selectionStatusText && (
          <div className='flex flex-col text-center gap-3'>
            <p className='text-lg'>{selection.bet}</p>
            <p className='font-bold capitalize'>{selectionStatusText}</p>
          </div>
        )}
      </div>
    );
  };

  const WinnerSection = ({ fight }) => {
    let userResultText;
    if (user && selections) {
      const selection = selections[fight.id];
      if (!selection) return null;
      if (selection.winner && selection.winner === user.id) userResultText = 'You Win!';
      else if (selection.winner && selection.winner !== user.id) userResultText = 'You Lose!';
    }
    return (
      <div className='flex flex-col text-center'>
        {fight.winner && (
          <div className='flex flex-col text-center gap-3'>
            <p className='text-yellow-500 font-bold'>
              Round {fight.round} | {fight.method}
            </p>
            {userResultText && <p className='font-bold capitalize'>{userResultText}</p>}
          </div>
        )}
      </div>
    );
  };

  if (fightCards && fightCards.length > 0) {
    return (
      <div>
        {fightCards.map((cardType) => (
          <div key={cardType} className='mb-4'>
            <ul className='space-y-4'>
              {fights[cardType]?.map((fight) => {
                const userDibs = selections?.[fight?.id]?.['dibs'] === user?.id;
                const confirmed = selections?.[fight?.id]?.['confirmed'];
                let borderColor = 'border-white';
                if (selections && !confirmed && userDibs) {
                  borderColor = 'border-red-500';
                } else if (selections && !confirmed && !userDibs) {
                  borderColor = 'border-blue-500';
                }
                return (
                  <li
                    key={fight?.id}
                    ref={(el) => (fightRefs.current[fight?.id] = el)}
                    className={`p-4 bg-white shadow rounded border-2 ${borderColor}`}
                  >
                    <div className='flex items-center justify-between w-full'>
                      <FighterButton fight={fight} selection={selections?.[fight?.id]} color='red' />
                      <div className='flex flex-col justify-between'>
                        <InfoSection fight={fight} />
                        <SelectionStatusSection fight={fight} />
                        <WinnerSection fight={fight} />
                      </div>
                      <FighterButton fight={fight} selection={selections?.[fight?.id]} color='blue' />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  }
};

export default Fights;
