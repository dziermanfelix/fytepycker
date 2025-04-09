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
  const [isSelectionProcessing, setIsSelectionProcessing] = useState(false);

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
    if (isSelectionProcessing) return;

    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }

    setIsSelectionProcessing(true);
    try {
      await postSelection(fightId, fighterName);
      refetchSelections();

      if (ws?.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            action: 'wsUpdateSelections',
            selections: selections,
          })
        );
      }
    } finally {
      setIsSelectionProcessing(false);
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
