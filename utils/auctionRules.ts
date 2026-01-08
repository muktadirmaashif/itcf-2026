
import { PlayerCategory, Team, Player, AuctionPhase, BidState } from '../types';
import { BASE_PRICES, MAX_PURSE, CAT_A_B_COMBINED_CAP, MIN_SQUAD_SIZE } from '../constants';
import { formatCurrency } from './format';

/**
 * Calculates the next minimum bid.
 * Rule: If no one has bid yet, the next bid is the base price.
 * Rule: Cat A - +1k until 25k, then +2k.
 * Rule: Cat B/C - +500 until 8k, then +1k.
 */
export const getNextMinBid = (currentPrice: number, category: PlayerCategory, currentBidderId: string | null): number => {
  // If nobody has bid yet, the next bid is the base price
  if (!currentBidderId) {
    return currentPrice;
  }

  if (category === PlayerCategory.A) {
    return currentPrice >= 25000 ? currentPrice + 2000 : currentPrice + 1000;
  } else {
    // Categories B and C
    return currentPrice >= 8000 ? currentPrice + 1000 : currentPrice + 500;
  }
};

/**
 * Validates if a team can place a bid.
 * Checks budget, A+B combined cap, and the safety net for remaining slots.
 */
export const canTeamBid = (
  team: Team, 
  amount: number, 
  player: Player, 
  phase: AuctionPhase,
  bidState: BidState
): { allowed: boolean; reason?: string } => {
  // 1. Basic Budget Check
  if (team.budget < amount) {
    return { allowed: false, reason: "Insufficient budget" };
  }

  // 2. Category A + B Combined Cap Check (75,000 Points)
  if (player.category === PlayerCategory.A || player.category === PlayerCategory.B) {
    const currentABSpend = team.categorySpend[PlayerCategory.A] + team.categorySpend[PlayerCategory.B];
    if (currentABSpend + amount > CAT_A_B_COMBINED_CAP) {
      return { allowed: false, reason: `A+B Combined Cap (75k) Exceeded` };
    }
  }

  // 3. Safety Net Check: Ensure team has enough left to fill 15 players at Cat C Base Price (3k)
  const currentSquadSize = team.players.length;
  // We are checking the state *after* this hypothetical bid is accepted
  const newSquadSize = currentSquadSize + 1;
  const budgetAfterBid = team.budget - amount;
  const remainingSlotsToFill = Math.max(0, MIN_SQUAD_SIZE - newSquadSize);
  const costToFillAtMin = remainingSlotsToFill * BASE_PRICES[PlayerCategory.C];

  if (budgetAfterBid < costToFillAtMin) {
    return { 
      allowed: false, 
      reason: `Safety Net: Need ${formatCurrency(costToFillAtMin)} to fill remaining ${remainingSlotsToFill} slots` 
    };
  }

  return { allowed: true };
};
