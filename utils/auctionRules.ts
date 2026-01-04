import { PlayerCategory, Team, Player, AuctionPhase } from '../types';
import { BASE_PRICES, MAX_PURSE, CAT_A_CAP, MIN_SQUAD_SIZE } from '../constants';

// Calculate next minimum bid based on current price and category
export const getNextMinBid = (currentPrice: number, category: PlayerCategory): number => {
  if (category === PlayerCategory.A) {
    // A: 1k initially; 2k once price reaches 20k
    return currentPrice >= 20000 ? currentPrice + 2000 : currentPrice + 1000;
  } else {
    // B & C: 500 initially; 1k once price reaches 8k
    return currentPrice >= 8000 ? currentPrice + 1000 : currentPrice + 500;
  }
};

export const canTeamBid = (team: Team, amount: number, player: Player, phase: AuctionPhase): { allowed: boolean; reason?: string } => {
  // 1. Basic Budget Check
  if (team.budget < amount) {
    return { allowed: false, reason: "Insufficient funds" };
  }

  // 2. Category A Cap Check
  if (player.category === PlayerCategory.A) {
    const projectedASpend = team.categorySpend[PlayerCategory.A] + amount;
    if (projectedASpend > CAT_A_CAP) {
      return { allowed: false, reason: `Category A Cap Exceeded (Max ${CAT_A_CAP.toLocaleString()})` };
    }
  }

  const currentSquadSize = team.players.length;
  const newSquadSize = currentSquadSize + 1;
  const budgetAfterBid = team.budget - amount;

  // 3. Mid-Auction Validation (Specific Rule: After Cat B/at 8 players, need 21k)
  // Logic: If this purchase results in the team having 8 or more players (usually relevant during Cat B or transition),
  // they MUST retain 21,000 points.
  if (newSquadSize >= 8) {
      if (budgetAfterBid < 21000) {
           return { allowed: false, reason: "Mid-Auction Rule: Must retain 21k BDT when reaching 8 players." };
      }
  }

  // 4. General Budget Safety Net (Min 15 Players)
  // If team has less than 8 players (or specifically after the 21k rule applies), 
  // ensure they can fill the REST of the squad to 15 using Base Price of Cat C.
  const remainingSlotsToFill = Math.max(0, MIN_SQUAD_SIZE - newSquadSize);
  const costToFill = remainingSlotsToFill * BASE_PRICES[PlayerCategory.C];

  if (budgetAfterBid < costToFill) {
    return { allowed: false, reason: `Safety Net: Need ${costToFill} reserve for min 15 players.` };
  }

  return { allowed: true };
};
