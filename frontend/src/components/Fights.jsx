import { useRef, useEffect } from 'react';
import { getFightCardTypes } from '@/utils/fightTabUtils';
import { getInitials } from '@/utils/winningsDisplayUtils';

const statusBadgeStyles = {
  action: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
  waiting: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
  confirmed: 'bg-stone-500/10 text-stone-600 ring-stone-500/20',
  win: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  lose: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
};

const Fights = ({ fights, user, selections, fighterClicked, readyFight, processingFightId = null }) => {
  const fightRefs = useRef({});

  useEffect(() => {
    if (readyFight && fightRefs.current[readyFight]) {
      fightRefs.current[readyFight].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [readyFight]);

  const fightCards = getFightCardTypes();

  const isYourTurn = (fight) => {
    if (!user || !selections) return false;
    const selection = selections[fight?.id];
    return Boolean(selection && !selection.confirmed && !fight?.winner && selection.dibs === user.id);
  };

  const Fighter = ({ img, name }) => (
    <div className='flex h-full w-full flex-col items-center gap-1 text-center'>
      {img ? (
        <img src={img} alt={name} className='h-16 w-16 shrink-0 object-cover object-top' />
      ) : (
        <div className='flex h-16 w-16 shrink-0 items-center justify-center bg-stone-800 text-sm font-bold tracking-wider text-white'>
          {getInitials(name)}
        </div>
      )}
      <span className='line-clamp-2 block h-8 w-full text-xs font-semibold leading-4 text-stone-800'>{name}</span>
    </div>
  );

  const FighterButton = ({ fight, selection, color, yourTurn }) => {
    let name = fight.blue_name;
    let img = fight.blue_img;
    if (color === 'red') {
      name = fight.red_name;
      img = fight.red_img;
    }
    const isProcessing = processingFightId !== null;
    const selectable =
      !isProcessing &&
      !fight.winner &&
      selection &&
      !selection.confirmed &&
      selection.dibs === user?.id &&
      selection.otherSelection !== name;

    return (
      <button
        type='button'
        className={`flex h-28 w-28 shrink-0 flex-col items-center justify-start rounded-lg p-1.5 transition-all duration-300
          ${fight?.winner === name ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
          ${selections ? getFighterButtonColor(fight, name, yourTurn && selectable) : ''}
          ${yourTurn && selectable ? 'pick-ready-ring' : ''}
          ${yourTurn && !selectable ? 'opacity-40' : ''}`}
        onClick={
          selectable
            ? (e) => {
                fighterClicked(e, fight?.id, name);
              }
            : null
        }
        disabled={isProcessing || !selectable}
      >
        <Fighter img={img} name={name} />
      </button>
    );
  };

  const getFighterButtonColor = (fight, fighterName, highlightSelectable) => {
    if (selections[fight.id]?.userSelection === fighterName) return 'bg-rose-500/15 ring-1 ring-inset ring-rose-400';
    if (selections[fight.id]?.otherSelection === fighterName) return 'bg-sky-500/15 ring-1 ring-inset ring-sky-400';
    if (highlightSelectable) return 'bg-white ring-2 ring-inset ring-rose-400';
    return 'bg-stone-100';
  };

  const getSelectionStatus = (fight) => {
    if (!user || !selections) return null;
    const selection = selections[fight.id];
    if (!selection || fight.winner) return null;

    if (selection.confirmed) {
      return { label: 'Picked', tone: 'confirmed', bet: selection.bet };
    }
    if (selection.dibs === user.id) {
      return { label: 'Your pick', tone: 'action', bet: selection.bet, pulse: true };
    }
    return { label: 'Their pick', tone: 'waiting', bet: selection.bet };
  };

  const getResultStatus = (fight) => {
    if (!fight.winner) return null;
    const method =
      fight.round != null && fight.method
        ? `R${fight.round} · ${fight.method}`
        : fight.method || (fight.round != null ? `Round ${fight.round}` : null);

    let result = null;
    if (user && selections?.[fight.id]) {
      const selection = selections[fight.id];
      if (selection.winner && selection.winner === user.id) {
        result = { label: `Won ${selection.bet}`, tone: 'win' };
      } else if (selection.winner && selection.winner !== user.id) {
        result = { label: `Lost ${selection.bet}`, tone: 'lose' };
      }
    }

    return { method, result };
  };

  const CenterMeta = ({ fight }) => {
    const status = getSelectionStatus(fight);
    const outcome = getResultStatus(fight);

    return (
      <div className='flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-2 text-center'>
        <p className='text-[10px] font-semibold uppercase tracking-wider text-stone-400'>{fight?.weight_class}</p>

        {status?.bet != null && !outcome && (
          <p className='text-sm font-bold tabular-nums text-stone-900'>{status.bet}</p>
        )}

        {status?.label && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
              statusBadgeStyles[status.tone]
            }`}
          >
            {status.pulse && <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500' />}
            {status.label}
          </span>
        )}

        {outcome?.method && (
          <p className='text-[11px] font-medium uppercase tracking-wide text-amber-700'>{outcome.method}</p>
        )}

        {outcome?.result && (
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
              statusBadgeStyles[outcome.result.tone]
            }`}
          >
            {outcome.result.label}
          </span>
        )}
      </div>
    );
  };

  const getFightAccent = (fight) => {
    if (!selections) return { bar: '', pulse: false };
    const selection = selections[fight?.id];
    if (!selection) return { bar: '', pulse: false };
    const yourDibs = selection.dibs === user?.id;
    const awaitingYourPick = yourDibs && !selection.confirmed && !fight.winner;
    return {
      bar: yourDibs ? 'bg-rose-500' : 'bg-sky-500',
      pulse: awaitingYourPick,
    };
  };

  const populatedFightCards = fightCards?.filter((cardType) => fights[cardType]?.length > 0) || [];

  if (populatedFightCards && populatedFightCards.length > 0) {
    return (
      <div className='space-y-4'>
        {populatedFightCards.map((cardType) => (
          <section key={cardType} className='overflow-hidden rounded-xl border border-stone-200 bg-white'>
            <div className='border-b border-stone-100 bg-stone-50 px-3 py-2'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-stone-500'>{cardType}</h3>
            </div>
            <ul className='divide-y divide-stone-100'>
              {fights[cardType]?.map((fight) => {
                const accent = getFightAccent(fight);
                const yourTurn = isYourTurn(fight);
                const waiting = Boolean(
                  selections?.[fight?.id] && !selections[fight.id].confirmed && !yourTurn && !fight.winner,
                );

                return (
                  <li
                    key={fight?.id}
                    ref={(el) => (fightRefs.current[fight?.id] = el)}
                    className={`relative px-2 py-2 sm:px-3 ${
                      processingFightId === fight?.id ? 'pointer-events-none' : ''
                    } ${yourTurn ? 'pick-ready' : ''} ${waiting ? 'opacity-60' : ''}`}
                  >
                    {accent.bar && (
                      <div
                        className={`absolute inset-y-0 left-0 w-1.5 ${accent.bar} ${
                          accent.pulse ? 'animate-pulse' : ''
                        }`}
                      />
                    )}
                    {processingFightId === fight?.id && <div className='absolute inset-0 z-10 backdrop-blur-sm' />}
                    <div className='flex w-full items-center justify-between gap-1'>
                      <FighterButton
                        fight={fight}
                        selection={selections?.[fight?.id]}
                        color='red'
                        yourTurn={yourTurn}
                      />
                      <CenterMeta fight={fight} />
                      <FighterButton
                        fight={fight}
                        selection={selections?.[fight?.id]}
                        color='blue'
                        yourTurn={yourTurn}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    );
  }
};

export default Fights;
