import client from '@/api/client';
import { API_URLS } from '@/common/urls';
import { useEvents } from '@/contexts/EventsContext';
import Fights from '@/components/Fights';

const EventFights = () => {
  const {
    activeEventTab,
    activeFightTab,
    selections: initialSelections,
    selectedEvent,
    isLoading,
    isError,
    user,
    fights,
  } = useEvents();

  const postSelection = async (fightId, fighterName) => {
    try {
      const { data } = await client.post(API_URLS.SELECTION, {
        event: selectedEvent?.id,
        fight: fightId,
        user: user.id,
        fighter: fighterName,
      });
    } catch (error) {}
  };

  const selectable = activeEventTab === 'upcoming';

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading selections.</p>;

  return (
    <Fights
      postSelection={postSelection}
      selectable={selectable}
      activeFightTab={activeFightTab}
      initialSelections={initialSelections}
      fights={fights}
      user={user}
    />
  );
};

export default EventFights;
