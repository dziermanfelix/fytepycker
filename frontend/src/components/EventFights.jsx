import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEvents } from '@/contexts/EventsContext';
import Fights from '@/components/Fights';

const EventFights = () => {
  const {
    activeFightTab,
    selections: initialSelections,
    selectedEvent,
    isLoading,
    isError,
    user,
    fights,
    selectionResults,
  } = useEvents();

  const postSelection = async (fightId, fighterName) => {
    try {
      const { data } = await client.post(API_URLS.SELECTIONS, {
        event: selectedEvent?.id,
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
      user={user}
      fights={fights}
      initialSelections={initialSelections}
      selectionResults={selectionResults}
    />
  );
};

export default EventFights;
