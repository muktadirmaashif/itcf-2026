

export enum PlayerCategory {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
}

export interface Player {
  id: string;
  name: string;
  category: PlayerCategory;
  role: string;
  basePrice: number;
  status: PlayerStatus;
  soldPrice?: number;
  soldToTeamId?: string;
  isLotteryCandidate?: boolean;
}

export interface Team {
  id: string;
  name: string;
  captain?: string;
  budget: number;
  spent: number;
  players: Player[];
  categoryCounts: {
    [key in PlayerCategory]: number;
  };
  categorySpend: {
    [key in PlayerCategory]: number;
  };
}

export enum AuctionPhase {
  SETUP = 'SETUP',
  CATEGORY_A = 'CATEGORY_A',
  CATEGORY_B = 'CATEGORY_B',
  CATEGORY_C_AUCTION = 'CATEGORY_C_AUCTION',
  UNSOLD_ROUND = 'UNSOLD_ROUND',
  COMPLETE = 'COMPLETE',
}

export interface BidState {
  currentPlayerId: string | null;
  currentBidPrice: number;
  currentBidderTeamId: string | null;
  // Added interests tracking for Category C and locking state
  isInterestLocked: boolean;
  interests: Record<string, string[]>;
  history: { 
    teamId: string; 
    amount?: number; 
    type: string; 
    playerName?: string; 
    timestamp: number 
  }[];
}

export interface AuctionContextType {
  teams: Team[];
  players: Player[];
  phase: AuctionPhase;
  bidState: BidState;
  lastProcessedId: string | null;
  auctioneerPassword?: string;
  addTeam: (name: string) => void;
  startAuction: () => void;
  nextPlayer: () => void;
  placeBid: (teamId: string, amount: number) => void;
  soldPlayer: () => void;
  unsoldPlayer: () => void;
  undoLastAuction: () => Promise<void>;
  clearHistory: () => Promise<void>;
  setPhase: (phase: AuctionPhase) => void;
  resetAuction: (keepPlayers?: boolean) => Promise<void>;
  importPlayers: (data: Player[]) => Promise<void>;
  importTeams: (teams: {id: string, name: string, captain?: string}[]) => Promise<void>;
  getPlayerById: (id: string) => Player | undefined;
  getTeamById: (id: string) => Team | undefined;
  // Added for Team Dashboard interactions
  toggleInterest: (playerId: string, teamId: string) => Promise<void>;
  setInterestLocked: (locked: boolean) => Promise<void>;
}