

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Player, 
  Team, 
  PlayerCategory, 
  PlayerStatus, 
  AuctionPhase, 
  BidState, 
  AuctionContextType 
} from '../types';
import { AuctionService } from '../services/auctionService';
import { supabase } from '../utils/supabaseClient';
import { BASE_PRICES, MAX_PURSE } from '../constants';

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider = ({ children }: { children?: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setLocalPhase] = useState<AuctionPhase>(AuctionPhase.SETUP);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  const [auctioneerPassword, setAuctioneerPassword] = useState<string>('TPL-PRI-SECURE-9902-AUCTION-2026');
  
  const [bidState, setBidState] = useState<BidState>({
    currentPlayerId: null,
    currentBidPrice: 0,
    currentBidderTeamId: null,
    // Initialize new state fields
    isInterestLocked: false,
    interests: {},
    history: [],
  });

  const syncState = async () => {
    try {
      const data = await AuctionService.getInitialState();
      
      const mappedPlayers: Player[] = data.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        role: p.role,
        basePrice: p.base_price,
        status: p.status,
        soldPrice: p.sold_price,
        soldToTeamId: p.sold_to_team_id
      }));
      
      setPlayers(mappedPlayers);
      setTeams(data.teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        captain: t.captain,
        budget: t.budget,
        spent: t.spent,
        categoryCounts: t.category_counts || { A: 0, B: 0, C: 0 },
        categorySpend: t.category_spend || { A: 0, B: 0, C: 0 },
        players: mappedPlayers.filter(p => p.soldToTeamId === t.id)
      })));

      if (data.state) {
        setLocalPhase(data.state.phase as AuctionPhase);
        if (data.state.auctioneer_password) setAuctioneerPassword(data.state.auctioneer_password);
        setBidState({
          currentPlayerId: data.state.current_player_id,
          currentBidPrice: data.state.current_bid_price,
          currentBidderTeamId: data.state.current_bidder_team_id,
          // Sync new state fields from Supabase
          isInterestLocked: data.state.is_interest_locked || false,
          interests: data.state.interests || {},
          history: data.state.history || [],
        });
      }
    } catch (err) {
      console.error("Critical State Sync Error:", err);
    }
  };

  useEffect(() => {
    syncState();
    const channel = supabase.channel('broadcast-auction')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => syncState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => syncState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_state' }, () => syncState())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const startAuction = () => AuctionService.setPhase(AuctionPhase.CATEGORY_A);

  const nextPlayer = async () => {
    const candidates = players.filter(p => 
      (phase === AuctionPhase.CATEGORY_A && p.category === PlayerCategory.A && p.status === PlayerStatus.AVAILABLE) ||
      (phase === AuctionPhase.CATEGORY_B && p.category === PlayerCategory.B && p.status === PlayerStatus.AVAILABLE) ||
      (phase === AuctionPhase.CATEGORY_C_AUCTION && p.category === PlayerCategory.C && p.status === PlayerStatus.AVAILABLE) ||
      (phase === AuctionPhase.UNSOLD_ROUND && p.status === PlayerStatus.UNSOLD)
    );

    if (candidates.length > 0) {
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      await supabase.from('auction_state').update({ 
        current_player_id: next.id, 
        current_bid_price: next.basePrice, 
        current_bidder_team_id: null 
      }).eq('id', 1);
    }
  };

  const placeBid = (teamId: string, amount: number) => {
    const player = players.find(p => p.id === bidState.currentPlayerId);
    const history = [{ teamId, amount, type: 'bid', playerName: player?.name, timestamp: Date.now() }, ...bidState.history];
    return AuctionService.recordBid(amount, teamId, history);
  };

  const soldPlayer = async () => {
    const { currentPlayerId, currentBidPrice, currentBidderTeamId, history } = bidState;
    if (!currentPlayerId || !currentBidderTeamId) return;

    const player = players.find(p => p.id === currentPlayerId);
    const team = teams.find(t => t.id === currentBidderTeamId);
    if (!player || !team) return;

    const soldEvent = { teamId: currentBidderTeamId, amount: currentBidPrice, type: 'sold', playerName: player.name, timestamp: Date.now() };
    const updatedHistory = [soldEvent, ...history];

    await AuctionService.updateTeamFinances(currentBidderTeamId, {
      budget: team.budget - currentBidPrice,
      spent: team.spent + currentBidPrice,
      categoryCounts: { ...team.categoryCounts, [player.category]: (team.categoryCounts[player.category] || 0) + 1 },
      categorySpend: { ...team.categorySpend, [player.category]: (team.categorySpend[player.category] || 0) + currentBidPrice }
    });

    await AuctionService.sellPlayer(currentPlayerId, currentBidderTeamId, currentBidPrice, updatedHistory);
    setLastProcessedId(currentPlayerId);
  };

  const unsoldPlayer = async () => {
    const { currentPlayerId, history } = bidState;
    if (!currentPlayerId) return;
    const player = players.find(p => p.id === currentPlayerId);
    if (!player) return;

    let updateData: any = { status: PlayerStatus.UNSOLD };
    if (player.category === PlayerCategory.A) {
      updateData = { category: PlayerCategory.B, status: PlayerStatus.AVAILABLE, base_price: BASE_PRICES[PlayerCategory.B] };
    } else if (player.category === PlayerCategory.B) {
      updateData = { category: PlayerCategory.C, status: PlayerStatus.AVAILABLE, base_price: BASE_PRICES[PlayerCategory.C] };
    }

    const unsoldEvent = { teamId: 'SYSTEM', type: 'unsold', playerName: player.name, timestamp: Date.now() };
    await Promise.all([
      supabase.from('players').update(updateData).eq('id', currentPlayerId),
      supabase.from('auction_state').update({ current_player_id: null, current_bid_price: 0, current_bidder_team_id: null, history: [unsoldEvent, ...history] }).eq('id', 1)
    ]);
    setLastProcessedId(currentPlayerId);
  };

  const undoLastAuction = async () => {
    if (!lastProcessedId) return;
    const player = players.find(p => p.id === lastProcessedId);
    if (!player) return;

    if (player.status === PlayerStatus.SOLD && player.soldToTeamId && player.soldPrice) {
      const team = teams.find(t => t.id === player.soldToTeamId);
      if (team) {
        await AuctionService.updateTeamFinances(team.id, {
          budget: team.budget + player.soldPrice,
          spent: team.spent - player.soldPrice,
          categoryCounts: { ...team.categoryCounts, [player.category]: Math.max(0, (team.categoryCounts[player.category] || 0) - 1) },
          categorySpend: { ...team.categorySpend, [player.category]: Math.max(0, (team.categorySpend[player.category] || 0) - player.soldPrice) },
        });
      }
    }
    await Promise.all([
      supabase.from('players').update({ status: PlayerStatus.AVAILABLE, sold_price: null, sold_to_team_id: null }).eq('id', lastProcessedId),
      supabase.from('auction_state').update({ current_player_id: lastProcessedId, current_bid_price: player.basePrice, current_bidder_team_id: null }).eq('id', 1)
    ]);
    setLastProcessedId(null);
  };

  const importPlayers = async (newPlayers: Player[]) => {
    await supabase.from('players').delete().neq('id', 'placeholder');
    await supabase.from('players').insert(newPlayers.map(p => ({
      id: p.id, name: p.name, category: p.category, role: p.role, base_price: p.basePrice, status: PlayerStatus.AVAILABLE
    })));
  };

  const importTeams = async (newTeams: { id: string, name: string, captain?: string }[]) => {
    await supabase.from('teams').delete().neq('id', 'placeholder');
    await supabase.from('teams').insert(newTeams.map(t => ({
      id: t.id, name: t.name, captain: t.captain, budget: MAX_PURSE, spent: 0, category_counts: { A: 0, B: 0, C: 0 }, category_spend: { A: 0, B: 0, C: 0 }
    })));
  };

  // Added logic to handle Category C interest markers
  const toggleInterest = async (playerId: string, teamId: string) => {
    const currentInterests = { ...(bidState.interests || {}) };
    const playerInterests = currentInterests[playerId] || [];
    
    let updatedPlayerInterests;
    if (playerInterests.includes(teamId)) {
      updatedPlayerInterests = playerInterests.filter(id => id !== teamId);
    } else {
      updatedPlayerInterests = [...playerInterests, teamId];
    }
    
    currentInterests[playerId] = updatedPlayerInterests;
    
    const { error } = await supabase
      .from('auction_state')
      .update({ interests: currentInterests })
      .eq('id', 1);
      
    if (error) throw error;
  };

  // Logic to allow auctioneer to lock the interest selection phase
  const setInterestLocked = async (locked: boolean) => {
    const { error } = await supabase
      .from('auction_state')
      .update({ is_interest_locked: locked })
      .eq('id', 1);
    if (error) throw error;
  };

  return (
    <AuctionContext.Provider value={{
      teams, players, phase, bidState, lastProcessedId, auctioneerPassword,
      addTeam: () => {}, startAuction, nextPlayer, placeBid, soldPlayer, unsoldPlayer, undoLastAuction,
      clearHistory: () => supabase.from('auction_state').update({ history: [] }).eq('id', 1).then(() => syncState()),
      setPhase: (p) => AuctionService.setPhase(p),
      resetAuction: (keep) => AuctionService.resetSystem(keep),
      importPlayers, importTeams,
      getPlayerById: (id) => players.find(p => p.id === id),
      getTeamById: (id) => teams.find(t => t.id === id),
      toggleInterest,
      setInterestLocked,
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error("useAuction must be used within an AuctionProvider");
  return context;
};