
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getPlayerImagePath = (player: { id: string; name: string }): string => {
  const name = player.name.toLowerCase();
  
  // Special cases requested by user
  // Mapping names to specific WEBP files
  if (name.includes('mamoor')) return `players/Mamoor.webp`;
  if (name.includes('tahsin')) return `players/Tahsin.webp`;
  if (name.includes('asoad alvi yanur saom')) return `players/Md Asoad Alvi Yanur Saom.webp`;
  
  // Default behavior: use player ID with .webp extension
  return `players/${player.id}.webp`;
};
