import { getFightCards } from '@/utils/fightTabUtils';

const Fights = ({ activeFightTab, fights, user, selections, fighterClicked }) => {
  const fightCards = getFightCards(activeFightTab);

  const Fighter = ({ img, name, url }) => (
    <div className='flex-row items-center text-center justify-between'>
      <img src={img} alt={name} className='w-50 h-50 object-contain mb-2' />
      <a href={url} target='_blank' rel='noopener noreferrer' className='underline font-semibold'>
        {name}
      </a>
    </div>
  );

  const FighterButton = ({ fight, color }) => {
    let name = fight.blue_name;
    let img = fight.blue_img;
    let url = fight.blue_url;
    if (color === 'red') {
      name = fight.red_name;
      img = fight.red_img;
      url = fight.red_url;
    }
    const selectable = !fight.winner;
    return (
      <button
        className={`${
          fight?.winner === name && 'border-6 border-yellow-500'
        } p-2 rounded transition-colors duration-300 ${selections && determineColor(fight, name)}`}
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
    if (selections[fight.id]?.userFighter === fighterName) return 'bg-red-500';
    if (selections[fight.id]?.otherFighter === fighterName) return 'bg-blue-500';
    return 'bg-gray-200';
  };

  const WinnerSection = ({ fight }) => {
    let userResultText;
    if (user && selections) {
      const selection = selections[fight.id];
      if (!selection) return null;
      if (selection.winner === user.id) userResultText = 'You Win!';
      else userResultText = 'You Lose!';
    }
    return (
      <div className='flex flex-col text-center'>
        <p className='text-gray-600 mb-4'>{fight?.weight_class}</p>
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
          <div key={cardType}>
            <ul className='space-y-4'>
              {fights[cardType]?.map((fight) => (
                <li key={fight?.id} className='p-4 bg-white shadow rounded border '>
                  <div className='flex items-center justify-between w-full'>
                    <FighterButton fight={fight} color='red' />
                    <WinnerSection fight={fight} />
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
