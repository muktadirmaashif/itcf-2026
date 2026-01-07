
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
import { MAX_PURSE } from '../constants';
import { supabase } from '../utils/supabaseClient';

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider = ({ children }: { children?: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setLocalPhase] = useState<AuctionPhase>(AuctionPhase.SETUP);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [bidState, setBidState] = useState<BidState>({
    currentPlayerId: null,
    currentBidPrice: 0,
    currentBidderTeamId: null,
    history: [],
  });

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes, stateRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('players').select('*'),
        supabase.from('auction_state').select('*').eq('id', 1).maybeSingle()
      ]);

      if (playersRes.error || teamsRes.error) {
        console.error("Database Connection Error. Ensure tables exist.");
        return;
      }

      let mappedPlayers: Player[] = [];
      if (playersRes.data) {
        mappedPlayers = playersRes.data.map((p: any) => ({
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
      }

      if (teamsRes.data) {
        setTeams(teamsRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          captain: t.captain,
          budget: t.budget,
          spent: t.spent,
          categoryCounts: t.category_counts || { A: 0, B: 0, C: 0 },
          categorySpend: t.category_spend || { A: 0, B: 0, C: 0 },
          players: mappedPlayers.filter((p: any) => p.soldToTeamId === t.id)
        })));
      }

      if (stateRes.data) {
         setLocalPhase(stateRes.data.phase as AuctionPhase);
         setBidState({
           currentPlayerId: stateRes.data.current_player_id,
           currentBidPrice: stateRes.data.current_bid_price,
           currentBidderTeamId: stateRes.data.current_bidder_team_id,
           history: stateRes.data.history || [],
         });
      } else {
        await supabase.from('auction_state').upsert({
          id: 1,
          phase: AuctionPhase.SETUP,
          current_player_id: null,
          current_bid_price: 0,
          current_bidder_team_id: null,
          history: [],
        });
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Critical Network Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_state' }, (payload) => {
        if (payload.new) {
          const s = payload.new as any;
          setLocalPhase(s.phase as AuctionPhase);
          setBidState({
            currentPlayerId: s.current_player_id,
            currentBidPrice: s.current_bid_price,
            currentBidderTeamId: s.current_bidder_team_id,
            history: s.history || [],
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const startAuction = async () => {
    await supabase.from('auction_state').update({ phase: AuctionPhase.CATEGORY_A }).eq('id', 1);
    await fetchData();
  };

  const nextPlayer = async () => {
    let candidates: Player[] = [];
    if (phase === AuctionPhase.CATEGORY_A) candidates = players.filter(p => p.category === PlayerCategory.A && p.status === PlayerStatus.AVAILABLE);
    else if (phase === AuctionPhase.CATEGORY_B) candidates = players.filter(p => p.category === PlayerCategory.B && p.status === PlayerStatus.AVAILABLE);
    else if (phase === AuctionPhase.CATEGORY_C_AUCTION) candidates = players.filter(p => p.category === PlayerCategory.C && p.status === PlayerStatus.AVAILABLE);
    else if (phase === AuctionPhase.UNSOLD_ROUND) candidates = players.filter(p => p.status === PlayerStatus.UNSOLD);
    else candidates = players.filter(p => p.status === PlayerStatus.AVAILABLE);

    if (candidates.length > 0) {
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      await supabase.from('auction_state').update({ 
        current_player_id: next.id, 
        current_bid_price: next.basePrice, 
        current_bidder_team_id: null, 
      }).eq('id', 1);
      await fetchData();
    }
  };

  const placeBid = async (teamId: string, amount: number) => {
    const player = players.find(p => p.id === bidState.currentPlayerId);
    const newHistory = [{ teamId, amount, type: 'bid', playerName: player?.name, timestamp: Date.now() }, ...bidState.history];
    await supabase.from('auction_state').update({ current_bid_price: amount, current_bidder_team_id: teamId, history: newHistory }).eq('id', 1);
  };

  const soldPlayer = async () => {
    const { currentPlayerId, currentBidPrice, currentBidderTeamId, history } = bidState;
    if (!currentPlayerId || !currentBidderTeamId) return;

    const player = players.find(p => p.id === currentPlayerId);
    const team = teams.find(t => t.id === currentBidderTeamId);
    if (!player || !team) return;

    const soldEvent = { teamId: currentBidderTeamId, amount: currentBidPrice, type: 'sold', playerName: player.name, timestamp: Date.now() };
    await Promise.all([
      supabase.from('players').update({ status: PlayerStatus.SOLD, sold_price: currentBidPrice, sold_to_team_id: currentBidderTeamId }).eq('id', currentPlayerId),
      supabase.from('teams').update({
        budget: team.budget - currentBidPrice, spent: team.spent + currentBidPrice,
        category_counts: { ...team.categoryCounts, [player.category]: (team.categoryCounts[player.category] || 0) + 1 },
        category_spend: { ...team.categorySpend, [player.category]: (team.categorySpend[player.category] || 0) + currentBidPrice },
      }).eq('id', currentBidderTeamId),
      supabase.from('auction_state').update({ current_player_id: null, current_bid_price: 0, current_bidder_team_id: null, history: [soldEvent, ...history] }).eq('id', 1)
    ]);
    setLastProcessedId(currentPlayerId);
    await fetchData();
  };

  const unsoldPlayer = async () => {
    const { currentPlayerId, history } = bidState;
    if (!currentPlayerId) return;
    const player = players.find(p => p.id === currentPlayerId);
    if (!player) return;

    const unsoldEvent = { teamId: 'SYSTEM', type: 'unsold', playerName: player.name, timestamp: Date.now() };
    await Promise.all([
      supabase.from('players').update({ status: PlayerStatus.UNSOLD }).eq('id', currentPlayerId),
      supabase.from('auction_state').update({ current_player_id: null, current_bid_price: 0, current_bidder_team_id: null, history: [unsoldEvent, ...history] }).eq('id', 1)
    ]);
    setLastProcessedId(currentPlayerId);
    await fetchData();
  };

  const undoLastAuction = async () => {
    if (!lastProcessedId) return;
    const player = players.find(p => p.id === lastProcessedId);
    if (!player) return;

    try {
      if (player.status === PlayerStatus.SOLD && player.soldToTeamId && player.soldPrice) {
        const team = teams.find(t => t.id === player.soldToTeamId);
        if (team) {
          await supabase.from('teams').update({
            budget: team.budget + player.soldPrice,
            spent: team.spent - player.soldPrice,
            category_counts: { ...team.categoryCounts, [player.category]: Math.max(0, (team.categoryCounts[player.category] || 0) - 1) },
            category_spend: { ...team.categorySpend, [player.category]: Math.max(0, (team.categorySpend[player.category] || 0) - player.soldPrice) },
          }).eq('id', team.id);
        }
      }
      await Promise.all([
        supabase.from('players').update({ status: PlayerStatus.AVAILABLE, sold_price: null, sold_to_team_id: null }).eq('id', lastProcessedId),
        supabase.from('auction_state').update({ current_player_id: lastProcessedId, current_bid_price: player.basePrice, current_bidder_team_id: null }).eq('id', 1)
      ]);
      setLastProcessedId(null);
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const clearHistory = async () => {
    await supabase.from('auction_state').update({ history: [] }).eq('id', 1);
    await fetchData();
  };

  const importPlayers = async (newPlayers: Player[]) => {
    await supabase.from('players').delete().neq('id', 'placeholder');
    await supabase.from('players').insert(newPlayers.map(p => ({
      id: p.id, name: p.name, category: p.category, role: p.role, base_price: p.basePrice, status: PlayerStatus.AVAILABLE
    })));
    await fetchData();
  };

  const importTeams = async (newTeams: { id: string, name: string, captain?: string }[]) => {
    await supabase.from('teams').delete().neq('id', 'placeholder');
    await supabase.from('teams').insert(newTeams.map(t => ({
      id: t.id, name: t.name, captain: t.captain, budget: MAX_PURSE, spent: 0, category_counts: { A: 0, B: 0, C: 0 }, category_spend: { A: 0, B: 0, C: 0 }
    })));
    await fetchData();
  };

  const resetAuction = async (keepPlayers: boolean = true) => {
    await supabase.from('players').update({ status: PlayerStatus.AVAILABLE, sold_price: null, sold_to_team_id: null }).neq('id', 'placeholder');
    await supabase.from('teams').update({ budget: MAX_PURSE, spent: 0, category_counts: { A: 0, B: 0, C: 0 }, category_spend: { A: 0, B: 0, C: 0 } }).neq('id', 'placeholder');
    await supabase.from('auction_state').update({ phase: AuctionPhase.SETUP, current_player_id: null, current_bid_price: 0, current_bidder_team_id: null, history: [] }).eq('id', 1);
    await fetchData();
  };

  return (
    <AuctionContext.Provider value={{
      teams, players, phase, bidState, lastProcessedId,
      addTeam: () => {}, startAuction, nextPlayer, placeBid, soldPlayer, unsoldPlayer, undoLastAuction, clearHistory,
      setPhase: (p) => supabase.from('auction_state').update({ phase: p }).eq('id', 1).then(() => fetchData()),
      resetAuction, setupNewAuction: async () => {}, importPlayers, importTeams,
      getPlayerById: (id) => players.find(p => p.id === id),
      getTeamById: (id) => teams.find(t => t.id === id)
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
