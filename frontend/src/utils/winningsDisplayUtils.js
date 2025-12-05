export const getWinningsTextColor = (winnings) => {
  let color = 'text-gray-500';
  if (winnings > 0) color = 'text-green-600';
  else if (winnings < 0) color = 'text-red-600';
  return color;
};

export const getWinningsBackgroundColor = (winnings) => {
  let color = 'bg-gray-300';
  if (winnings > 0) color = 'bg-green-600';
  else if (winnings < 0) color = 'bg-red-600';
  return color;
};

export const getWinningsBorderColor = (winnings) => {
  let color = 'border border-gray-300';
  if (winnings > 0) color = 'border border-green-600';
  else if (winnings < 0) color = 'border border-red-600';
  return color;
};