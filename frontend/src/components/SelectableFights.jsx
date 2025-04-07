import { useState, useEffect } from 'react';
import { getFightCards } from '@/utils/fightTabUtils';
import Fights from '@/components/Fights';

const SelectableFights = ({ selectedMatchup, postSelection, activeFightTab, initialSelections, fights, user, ws }) => {
  const [selections, setSelections] = useState({});
  const fightCards = getFightCards(activeFightTab);

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      if (selectedMatchup) {
        const selectionsMap = initialSelections.reduce((acc, selection) => {
          const fight = selection.fight;
          if (!acc[fight]) {
            acc[fight] = { ...selection };
          }
          if (selectedMatchup.user_a.id === user.id) {
            acc[fight].userFighter = selection.user_a_selection;
            acc[fight].otherFighter = selection.user_b_selection;
          } else {
            acc[fight].userFighter = selection.user_b_selection;
            acc[fight].otherFighter = selection.user_a_selection;
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
        />
      </div>
    );
  }
};

export default SelectableFights;
