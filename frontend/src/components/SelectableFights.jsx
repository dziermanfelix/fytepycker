import { useState, useEffect } from 'react';
import { getFightCards } from '@/utils/fightTabUtils';
import Fights from '@/components/Fights';

const SelectableFights = ({ postSelection, activeFightTab, initialSelections, fights, user, selectionResults, ws }) => {
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
          selectionResults={selectionResults}
          fighterClicked={fighterClicked}
        />
      </div>
    );
  }
};

export default SelectableFights;
