import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useMatchups } from '@/contexts/MatchupsContext';
import Fights from '@/components/Fights';

const MatchupFights = ({ selectable }) => {
  const {
    user,
    selectedMatchup,
    selections: initialSelections,
    isLoading,
    isError,
    activeFightTab,
    fights,
  } = useMatchups();

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

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <Fights
      postSelection={postSelection}
      activeFightTab={activeFightTab}
      initialSelections={initialSelections}
      fights={fights}
      user={user}
    />
  );
};

export default MatchupFights;
