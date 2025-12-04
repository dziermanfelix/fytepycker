export const getReadyFight = (selections, matchup) => {
  if (matchup.event.complete) return null;
  const cardPriority = { early: 0, prelim: 1, main: 2 };
  const allFights = [
    ...(matchup.event.fights.early || []),
    ...(matchup.event.fights.prelim || []),
    ...(matchup.event.fights.main || []),
  ];
  const readyFight =
    selections
      .map((selection) => {
        const fight = allFights.find((f) => f.id === selection.fight);
        return !selection.confirmed && !fight?.winner ? { ...selection, _fight: fight } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const fightA = a._fight;
        const fightB = b._fight;
        const cardDiff = cardPriority[fightA.card] - cardPriority[fightB.card];
        if (cardDiff !== 0) return cardDiff;
        return fightB.order - fightA.order;
      })[0]?.fight || null;
  return readyFight;
};
