export const isBettingLocked = (event) => Boolean(event?.bets_locked);

export const getReadyFight = (selections, matchup, userId = null) => {
  if (matchup.event.complete || isBettingLocked(matchup.event)) return null;
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
        const isOpen = !selection.confirmed && !fight?.winner;
        const hasDibs = userId == null || selection.dibs === userId;
        return isOpen && hasDibs ? { ...selection, _fight: fight } : null;
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
