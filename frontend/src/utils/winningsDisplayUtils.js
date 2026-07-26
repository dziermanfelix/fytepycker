export const getWinningsTextColor = (winnings) => {
  let color = 'text-stone-500';
  if (winnings > 0) color = 'text-emerald-600';
  else if (winnings < 0) color = 'text-rose-600';
  return color;
};

export const getWinningsBackgroundColor = (winnings) => {
  let color = 'bg-stone-300';
  if (winnings > 0) color = 'bg-emerald-600';
  else if (winnings < 0) color = 'bg-rose-600';
  return color;
};

export const getWinningsBorderColor = (winnings) => {
  let color = 'border border-stone-300';
  if (winnings > 0) color = 'border border-emerald-600';
  else if (winnings < 0) color = 'border border-rose-600';
  return color;
};

export const formatWinnings = (winnings) => {
  const value = Number(winnings) || 0;
  if (value > 0) return `+${value}`;
  return `${value}`;
};

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
