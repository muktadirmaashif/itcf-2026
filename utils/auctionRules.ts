
import { PlayerCategory, Team, Player, AuctionPhase, BidState } from '../types';
import { BASE_PRICES, MAX_PURSE, CAT_A_B_COMBINED_CAP, MIN_SQUAD_SIZE } from '../constants';

// Calculate next minimum bid based on current price and category
export const getNextMinBid = (currentPrice: number, category: PlayerCategory): number => {
  if (category === PlayerCategory.A) {
    // A: 1k initially; 2k once price reaches 25,000 points
    return currentPrice >= 25000 ? currentPrice + 2000 : currentPrice + 1000;
  } else {
    // B & C: 500 initially; 1k once price reaches 8,000 points
    return currentPrice >= 8000 ? currentPrice + 1000 : currentPrice + 500;
  }
};

export const canTeamBid = (
  team: Team, 
  amount: number, 
  player: Player, 
  phase: AuctionPhase,
  bidState: BidState
): { allowed: boolean; reason?: string } => {
  // 1. Basic Budget Check (Total Purse 120k)
  if (team.budget < amount) {
    return { allowed: false, reason: "Insufficient funds" };
  }

  // 2. Category A + B Combined Cap Check (75,000 Points)
  if (player.category === PlayerCategory.A || player.category === PlayerCategory.B) {
    const currentABSpend = team.categorySpend[PlayerCategory.A] + team.categorySpend[PlayerCategory.B];
    if (currentABSpend + amount > CAT_A_B_COMBINED_CAP) {
      return { allowed: false, reason: `A+B Cap Exceeded` };
    }
  }

  const currentSquadSize = team.players.length;
  const newSquadSize = currentSquadSize + 1;
  const budgetAfterBid = team.budget - amount;

  // 3. General Budget Safety Net (Min 15 Players)
  const remainingSlotsToFill = Math.max(0, MIN_SQUAD_SIZE - newSquadSize);
  const costToFill = remainingSlotsToFill * BASE_PRICES[PlayerCategory.C];

  if (budgetAfterBid < costToFill) {
    return { allowed: false, reason: `Safety Net: Need ${costToFill.toLocaleString()} for min 15` };
  }

  return { allowed: true };
};
