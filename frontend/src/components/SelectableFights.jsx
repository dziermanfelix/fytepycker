import { useState, useEffect } from 'react';
import { getFightCards } from '@/utils/fightTabUtils';
import Fights from '@/components/Fights';

const SelectableFights = ({
  selectedMatchup,
  postSelection,
  activeFightTab,
  initialSelections,
  refetchSelections,
  fights,
  user,
  ws,
}) => {
  const [selections, setSelections] = useState({});
  const fightCards = getFightCards(activeFightTab);
  const [readyFight, setReadyFight] = useState(null);

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      if (selectedMatchup) {
        const unconfirmedFights = initialSelections.filter((fight) => !fight.confirmed).sort((a, b) => b.id - a.id);
        const readyFight = unconfirmedFights.length > 0 ? unconfirmedFights[0].fight : null;
        setReadyFight(readyFight);
        const selectionsMap = initialSelections.reduce((acc, selection) => {
          const fight = selection.fight;

          if (!acc[fight]) {
            acc[fight] = { ...selection };
          }

          if (fight === readyFight) {
            acc[fight].ready = true;
          } else {
            acc[fight].ready = false;
          }

          if (selectedMatchup.user_a.id === user.id) {
            acc[fight].userSelection = selection.user_a_selection;
            acc[fight].otherSelection = selection.user_b_selection;
          } else {
            acc[fight].userSelection = selection.user_b_selection;
            acc[fight].otherSelection = selection.user_a_selection;
          }

          return acc;
        }, {});
        setSelections(selectionsMap);
      }
    }
  }, [initialSelections]);

  const fighterClicked = async (e, fightId, fighterName) => {
    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }

    const prevSelections = selections;
    const cur = prevSelections[fightId] || { userSelection: null, otherSelection: null };
    const userSelection = cur.userSelection;
    const otherSelection = cur.otherSelection;

    if (fighterName === userSelection) {
      setSelections({
        ...prevSelections,
        [fightId]: { ...cur, userSelection: null },
      });
      await postSelection(fightId, fighterName);
    } else if (fighterName === otherSelection) {
      return;
    } else {
      setSelections({
        ...prevSelections,
        [fightId]: { ...cur, userSelection: fighterName },
      });
      await postSelection(fightId, fighterName);
      refetchSelections();
    }

    if (ws?.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'wsUpdateSelections',
          selections: selections,
        })
      );
    }
  };

  if (fightCards && fightCards.length > 0) {
    return (
      <div>
        <Fights
          activeFightTab={activeFightTab}
          fights={fights}
          user={user}
          selections={selections}
          fighterClicked={fighterClicked}
          readyFight={readyFight}
        />
      </div>
    );
  }
};

export default SelectableFights;
