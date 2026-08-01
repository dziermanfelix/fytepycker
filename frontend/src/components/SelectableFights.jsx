import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getFightCardTypes } from '@/utils/fightTabUtils';
import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import Fights from '@/components/Fights';
import Spinner from '@/components/Spinner';
import { useMatchups } from '@/contexts/MatchupsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getReadyFight } from '@/common/fight';

const SelectableFights = () => {
  const {
    selectedMatchup,
    selections: initialSelections,
    refetchSelections,
    isLoadingSelections,
    isErrorSelections,
    fights,
    ws,
  } = useMatchups();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selections, setSelections] = useState({});
  const fightCards = getFightCardTypes();
  const [readyFight, setReadyFight] = useState(null);
  const [processingFightId, setProcessingFightId] = useState(null);

  useEffect(() => {
    if (Object.keys(initialSelections).length > 0) {
      if (selectedMatchup) {
        setReadyFight(getReadyFight(initialSelections, selectedMatchup, user?.id));
        const selectionsMap = initialSelections.reduce((acc, selection) => {
          const fight = selection.fight;

          if (!acc[fight]) {
            acc[fight] = { ...selection };
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
  }, [initialSelections, fights]);

  const postSelection = async (fightId, fighterName) => {
    try {
      const { data } = await client.post(API_URLS.SELECTIONS, {
        matchup: selectedMatchup?.id,
        fight: fightId,
        user: user.id,
        fighter: fighterName,
      });
    } catch (error) {}
  };

  const fighterClicked = async (e, fightId, fighterName) => {
    if (processingFightId !== null) return;

    if (e.target.tagName === 'A') {
      e.stopPropagation();
      return;
    }

    // Set processing immediately so user sees the blur overlay right away
    setProcessingFightId(fightId);

    try {
      await postSelection(fightId, fighterName);
      refetchSelections();

      queryClient.invalidateQueries({
        predicate: (query) => {
          const [endpoint, userId] = query.queryKey;
          return endpoint === API_URLS.MATCHUPS && userId === user?.id;
        },
      });

      if (ws?.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            action: 'wsUpdateSelections',
            selections: selections,
          }),
        );
      }
    } finally {
      setProcessingFightId(null);
    }
  };

  if (isLoadingSelections) return <Spinner />;
  if (isErrorSelections) return <p>Error loading selections.</p>;

  if (fightCards && fightCards.length > 0) {
    return (
      <div>
        <Fights
          fights={fights}
          user={user}
          selections={selections}
          fighterClicked={fighterClicked}
          readyFight={readyFight}
          processingFightId={processingFightId}
        />
      </div>
    );
  }
};

export default SelectableFights;
