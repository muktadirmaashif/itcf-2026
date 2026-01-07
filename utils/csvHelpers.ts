
import { Player, PlayerCategory, PlayerStatus, Team } from '../types';
import { BASE_PRICES } from '../constants';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'];
const getRandomRole = () => ROLES[Math.floor(Math.random() * ROLES.length)];

export const parseStandardPlayerCSV = (csvText: string): Player[] => {
  const lines = csvText.split('\n');
  const players: Player[] = [];
  
  let startIndex = 0;
  if (lines[0].toLowerCase().includes('category')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[,|]/).map(p => p.trim().replace(/^"|"$/g, ''));
    const data = parts.filter(p => p !== '');

    if (data.length >= 3) {
      const id = data[0];
      const name = data[1];
      const categoryStr = data[2].toUpperCase();
      const role = data[3] || getRandomRole();

      let category = PlayerCategory.C;
      if (categoryStr === 'A') category = PlayerCategory.A;
      if (categoryStr === 'B') category = PlayerCategory.B;

      players.push({
        id,
        name,
        category,
        role,
        basePrice: BASE_PRICES[category],
        status: PlayerStatus.AVAILABLE
      });
    }
  }
  return players;
}

export const parseTeamsCSV = (csvText: string): { id: string; name: string; captain?: string }[] => {
  const lines = csvText.split('\n');
  const teams: { id: string; name: string; captain?: string }[] = [];

  let startIndex = 0;
  if (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('id')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[,|]/).map(p => p.trim().replace(/^"|"$/g, ''));
    const data = parts.filter(p => p !== '');

    if (data.length >= 2) {
      teams.push({
        id: data[0],
        name: data[1],
        captain: data[2] || undefined
      });
    }
  }
  return teams;
};

export const generateTeamsCSV = (teams: Team[]): string => {
  const sortedTeams = teams.map(team => ({
    ...team,
    players: [...team.players].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    })
  }));

  const headers = sortedTeams.map(t => `"${t.name}"`);
  const csvRows = [headers.join(',')];
  const maxSquadSize = Math.max(...sortedTeams.map(t => t.players.length), 0);

  for (let i = 0; i < maxSquadSize; i++) {
    const row = sortedTeams.map(team => {
      const player = team.players[i];
      return player ? `"${player.name} [${player.category}] - ${player.soldPrice || 0}"` : "";
    });
    csvRows.push(row.join(','));
  }

  csvRows.push(sortedTeams.map(() => "").join(',')); 
  csvRows.push(sortedTeams.map(t => `"Total Spent: ${t.spent}"`).join(','));
  csvRows.push(sortedTeams.map(t => `"Remaining: ${t.budget}"`).join(','));
  csvRows.push(sortedTeams.map(t => `"Players: ${t.players.length}"`).join(','));

  csvRows.push(sortedTeams.map(t => `"Cat A: ${t.categoryCounts.A} (${t.categorySpend.A})"`).join(','));
  csvRows.push(sortedTeams.map(t => `"Cat B: ${t.categoryCounts.B} (${t.categorySpend.B})"`).join(','));
  csvRows.push(sortedTeams.map(t => `"Cat C: ${t.categoryCounts.C} (${t.categorySpend.C})"`).join(','));

  return csvRows.join('\n');
};
