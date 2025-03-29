const fightTabs = {
  all: ['main', 'prelim', 'early'],
  main: ['main'],
  prelim: ['prelim'],
  early: ['early'],
};

export const getFightCards = (activeFightTab) => {
  return fightTabs[activeFightTab] || [];
};
