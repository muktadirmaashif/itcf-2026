import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuctionContextType, AuctionPhase, BidState, Player, PlayerCategory, PlayerStatus, Team } from '../types';
import { MAX_PURSE } from '../constants';
import { supabase } from '../utils/supabaseClient';

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider = ({ children }: { children?: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setLocalPhase] = useState<AuctionPhase>(AuctionPhase.SETUP);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  
  const [bidState, setBidState] = useState<BidState>({
    currentPlayerId: null,
    currentBidPrice: 0,
    currentBidderTeamId: null,
    history: [],
  });

  // --- Initial Fetch & Realtime Subscription ---
  useEffect(() => {
    fetchData();

    // Subscribe to all changes
    const channels = supabase
      .channel('auction-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
             const newData = payload.new as any;
             setTeams(prev => prev.map(t => {
                 if (t.id === newData.id) {
                     return {
                         ...t,
                         name: newData.name,
                         budget: newData.budget,
                         spent: newData.spent,
                         categoryCounts: newData.category_counts || { A: 0, B: 0, C: 0 },
                         categorySpend: newData.category_spend || { A: 0, B: 0, C: 0 },
                         players: prev.find(pt => pt.id === t.id)?.players || []
                     };
                 }
                 return t;
             }));
          } else if (payload.eventType === 'INSERT') {
             const newData = payload.new as any;
             const newTeam: Team = {
                 id: newData.id,
                 name: newData.name,
                 budget: newData.budget,
                 spent: newData.spent,
                 categoryCounts: newData.category_counts || { A: 0, B: 0, C: 0 },
                 categorySpend: newData.category_spend || { A: 0, B: 0, C: 0 },
                 players: []
             };
             setTeams(prev => [...prev, newTeam]);
          } else if (payload.eventType === 'DELETE') {
             const old = payload.old as any;
             setTeams(prev => prev.filter(t => t.id !== old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
           if (payload.eventType === 'UPDATE') {
             const raw = payload.new as any;
             const updatedPlayer: Player = {
                 id: raw.id,
                 name: raw.name,
                 category: raw.category,
                 role: raw.role,
                 basePrice: raw.base_price,
                 status: raw.status,
                 soldPrice: raw.sold_price,
                 soldToTeamId: raw.sold_to_team_id
             };
             setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
           } else if (payload.eventType === 'INSERT') {
             const raw = payload.new as any;
             const newPlayer: Player = {
                 id: raw.id,
                 name: raw.name,
                 category: raw.category,
                 role: raw.role,
                 basePrice: raw.base_price,
                 status: raw.status,
                 soldPrice: raw.sold_price,
                 soldToTeamId: raw.sold_to_team_id
             };
             setPlayers(prev => [...prev, newPlayer]);
           } else if (payload.eventType === 'DELETE') {
             const old = payload.old as any;
             setPlayers(prev => prev.filter(p => p.id !== old.id));
           }
        }
      )
      .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'auction_state' },
         (payload) => {
            if (payload.new) {
               const s = payload.new as any;
               setLocalPhase(s.phase as AuctionPhase);
               setBidState({
                 currentPlayerId: s.current_player_id,
                 currentBidPrice: s.current_bid_price,
                 currentBidderTeamId: s.current_bidder_team_id,
                 history: s.history || []
               });
            }
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // Update teams whenever players change to reflect rosters
  useEffect(() => {
    setTeams(prevTeams => prevTeams.map(t => ({
      ...t,
      players: players.filter(p => p.soldToTeamId === t.id)
    })));
  }, [players]);


  const fetchData = async () => {
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').order('name');
    
    if (teamsError) {
      console.error("Error fetching teams. Check Supabase connection.", teamsError);
      return;
    }

    const { data: playersData, error: playersError } = await supabase.from('players').select('*');
    const { data: stateData, error: stateError } = await supabase.from('auction_state').select('*').single();

    if (teamsData && teamsData.length > 0) {
      const joinedTeams = teamsData.map((t: any) => ({
        id: t.id,
        name: t.name,
        budget: t.budget,
        spent: t.spent,
        categoryCounts: t.category_counts || { A: 0, B: 0, C: 0 },
        categorySpend: t.category_spend || { A: 0, B: 0, C: 0 },
        players: playersData 
            ? playersData
                .filter((p: any) => p.sold_to_team_id === t.id)
                .map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    role: p.role,
                    basePrice: p.base_price,
                    status: p.status,
                    soldPrice: p.sold_price,
                    soldToTeamId: p.sold_to_team_id
                })) 
            : []
      }));
      setTeams(joinedTeams);
    } else {
      setTeams([]);
    }

    if (playersData) {
      const mappedPlayers = playersData.map((p: any) => ({
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
    } else {
      setPlayers([]);
    }

    if (stateData) {
       setLocalPhase(stateData.phase as AuctionPhase);
       setBidState({
         currentPlayerId: stateData.current_player_id,
         currentBidPrice: stateData.current_bid_price,
         currentBidderTeamId: stateData.current_bidder_team_id,
         history: stateData.history || []
       });
    }
  };

  const setupNewAuction = async (teamNames: string[], newPlayers?: Player[]) => {
      const { error: stateError } = await supabase.from('auction_state').upsert({
        id: 1,
        phase: AuctionPhase.SETUP,
        current_player_id: null,
        current_bid_price: 0,
        current_bidder_team_id: null,
        history: []
      });
      if (stateError) throw new Error(`Failed to reset state: ${stateError.message}`);

      const { error: delPlayersError } = await supabase.from('players').delete().neq('id', '_');
      if (delPlayersError) throw new Error(`Failed to clear players: ${delPlayersError.message}`);

      const { error: delTeamsError } = await supabase.from('teams').delete().neq('id', '_');
      if (delTeamsError) throw new Error(`Failed to clear teams: ${delTeamsError.message}`);

      setTeams([]);
      setPlayers([]);
      setLocalPhase(AuctionPhase.SETUP);
      setBidState({ currentPlayerId: null, currentBidPrice: 0, currentBidderTeamId: null, history: [] });
      setLastProcessedId(null);

      if (teamNames.length > 0) {
        const teamsData = teamNames.map((name, idx) => ({
          id: `team-${Date.now()}-${idx}`,
          name,
          budget: MAX_PURSE,
          spent: 0,
          category_counts: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
          category_spend: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
        }));
        const { error: insertTeamError } = await supabase.from('teams').insert(teamsData);
        if (insertTeamError) throw new Error(`Failed to insert teams: ${insertTeamError.message}`);
      }

      if (newPlayers && newPlayers.length > 0) {
        const dbPlayers = newPlayers.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            role: p.role,
            base_price: p.basePrice,
            status: PlayerStatus.AVAILABLE,
            sold_price: null,
            sold_to_team_id: null
        }));
        const { error: insertPlayerError } = await supabase.from('players').insert(dbPlayers);
        if (insertPlayerError) throw new Error(`Failed to insert players: ${insertPlayerError.message}`);
      }
      
      fetchData();
  };

  const resetAuction = async (keepPlayers: boolean = false) => {
    if (keepPlayers) {
         await supabase.from('players').update({
             status: PlayerStatus.AVAILABLE,
             sold_price: null,
             sold_to_team_id: null
         }).neq('id', '_');
         
         const currentTeams = teams;
         const resetTeamsData = currentTeams.map(t => ({
             id: t.id,
             name: t.name,
             budget: MAX_PURSE,
             spent: 0,
             category_counts: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
             category_spend: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
         }));
         
         if (resetTeamsData.length > 0) {
             await supabase.from('teams').upsert(resetTeamsData.map(t => ({
                 id: t.id,
                 name: t.name,
                 budget: t.budget,
                 spent: t.spent,
                 category_counts: t.category_counts,
                 category_spend: t.category_spend
             })));
         }
    } else {
        await setupNewAuction([]);
        return;
    }

    await supabase.from('auction_state').upsert({
      id: 1,
      phase: AuctionPhase.SETUP,
      current_player_id: null,
      current_bid_price: 0,
      current_bidder_team_id: null,
      history: []
    });
    
    setLastProcessedId(null);
    fetchData();
  };

  const importPlayers = async (newPlayers: Player[]) => {
    const dbPlayers = newPlayers.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        role: p.role,
        base_price: p.basePrice,
        status: PlayerStatus.AVAILABLE,
        sold_price: null,
        sold_to_team_id: null
    }));
    
    await supabase.from('players').delete().neq('id', '_');
    if (dbPlayers.length > 0) {
      await supabase.from('players').insert(dbPlayers);
    }
    
    await resetAuction(true);
  };

  const importTeams = async (newTeams: {id: string, name: string}[]) => {
      await supabase.from('auction_state').upsert({
        id: 1,
        phase: AuctionPhase.SETUP,
        current_player_id: null,
        current_bid_price: 0,
        current_bidder_team_id: null,
        history: []
      });

      await supabase.from('players').update({
        status: PlayerStatus.AVAILABLE,
        sold_price: null,
        sold_to_team_id: null
      }).neq('id', '_');

      await supabase.from('teams').delete().neq('id', '_');

      if (newTeams.length > 0) {
        const teamsData = newTeams.map((t) => ({
          id: t.id,
          name: t.name,
          budget: MAX_PURSE,
          spent: 0,
          category_counts: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
          category_spend: { [PlayerCategory.A]: 0, [PlayerCategory.B]: 0, [PlayerCategory.C]: 0 },
        }));
        const { error } = await supabase.from('teams').insert(teamsData);
        if (error) throw new Error(`Failed to insert teams: ${error.message}`);
      }

      setLastProcessedId(null);
      fetchData();
  };

  const addTeam = () => {
    console.warn("Use setupNewAuction for adding teams.");
  };

  const updatePhase = async (newPhase: AuctionPhase) => {
    await supabase.from('auction_state').update({ phase: newPhase }).eq('id', 1);
  };

  const startAuction = async () => {
    await updatePhase(AuctionPhase.CATEGORY_A);
  };

  const setPhase = updatePhase;

  const getPlayerById = (id: string) => players.find(p => p.id === id);
  const getTeamById = (id: string) => teams.find(t => t.id === id);

  const nextPlayer = async () => {
    let candidates: Player[] = [];
    
    if (phase === AuctionPhase.CATEGORY_A) {
      candidates = players.filter(p => p.category === PlayerCategory.A && p.status === PlayerStatus.AVAILABLE);
    } else if (phase === AuctionPhase.CATEGORY_B) {
      candidates = players.filter(p => p.category === PlayerCategory.B && p.status === PlayerStatus.AVAILABLE);
    } else if (phase === AuctionPhase.CATEGORY_C_AUCTION) {
      candidates = players.filter(p => p.category === PlayerCategory.C && p.status === PlayerStatus.AVAILABLE);
    } else if (phase === AuctionPhase.UNSOLD_ROUND) {
      candidates = players.filter(p => p.status === PlayerStatus.UNSOLD);
    }

    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const next = candidates[randomIndex];
      
      await supabase.from('auction_state').update({
        current_player_id: next.id,
        current_bid_price: next.basePrice,
        current_bidder_team_id: null,
        history: []
      }).eq('id', 1);

    } else {
       await supabase.from('auction_state').update({
        current_player_id: null,
        current_bid_price: 0,
        current_bidder_team_id: null,
        history: []
      }).eq('id', 1);
      alert("No more available players found for this phase. Please change phase.");
    }
  };

  const placeBid = async (teamId: string, amount: number) => {
    const newHistory = [{ teamId, amount }, ...bidState.history];
    await supabase.from('auction_state').update({
      current_bid_price: amount,
      current_bidder_team_id: teamId,
      history: newHistory
    }).eq('id', 1);
  };

  const soldPlayer = async () => {
    const { currentPlayerId, currentBidPrice, currentBidderTeamId } = bidState;
    if (!currentPlayerId || !currentBidderTeamId) return;

    const player = getPlayerById(currentPlayerId);
    const team = getTeamById(currentBidderTeamId);
    if (!player || !team) return;

    setLastProcessedId(currentPlayerId);

    await supabase.from('players').update({
      status: PlayerStatus.SOLD,
      sold_price: currentBidPrice,
      sold_to_team_id: currentBidderTeamId
    }).eq('id', currentPlayerId);

    await supabase.from('teams').update({
      budget: team.budget - currentBidPrice,
      spent: team.spent + currentBidPrice,
      category_counts: { ...team.categoryCounts, [player.category]: team.categoryCounts[player.category] + 1 },
      category_spend: { ...team.categorySpend, [player.category]: team.categorySpend[player.category] + currentBidPrice },
    }).eq('id', currentBidderTeamId);

    await supabase.from('auction_state').update({
      current_player_id: null,
      current_bid_price: 0,
      current_bidder_team_id: null,
      history: []
    }).eq('id', 1);
  };

  const unsoldPlayer = async () => {
    const { currentPlayerId } = bidState;
    if (!currentPlayerId) return;

    setLastProcessedId(currentPlayerId);

    await supabase.from('players').update({
      status: PlayerStatus.UNSOLD
    }).eq('id', currentPlayerId);

    await supabase.from('auction_state').update({
      current_player_id: null,
      current_bid_price: 0,
      current_bidder_team_id: null,
      history: []
    }).eq('id', 1);
  };

  const undoLastAuction = async () => {
    if (!lastProcessedId) {
      alert("No recent action to undo or action already undone.");
      return;
    }

    const player = getPlayerById(lastProcessedId);
    if (!player) return;

    if (player.status === PlayerStatus.SOLD && player.soldToTeamId && player.soldPrice !== undefined) {
      const team = getTeamById(player.soldToTeamId);
      if (team) {
         await supabase.from('teams').update({
            budget: team.budget + player.soldPrice,
            spent: team.spent - player.soldPrice,
            category_counts: { ...team.categoryCounts, [player.category]: team.categoryCounts[player.category] - 1 },
            category_spend: { ...team.categorySpend, [player.category]: team.categorySpend[player.category] - player.soldPrice },
         }).eq('id', team.id);
      }
    }

    await supabase.from('players').update({
      status: PlayerStatus.AVAILABLE,
      sold_price: null,
      sold_to_team_id: null
    }).eq('id', lastProcessedId);

    await supabase.from('auction_state').update({
      current_player_id: lastProcessedId,
      current_bid_price: player.basePrice,
      current_bidder_team_id: null,
      history: []
    }).eq('id', 1);

    setLastProcessedId(null);
  };

  return (
    <AuctionContext.Provider value={{
      teams, players, phase, bidState, lastProcessedId,
      addTeam, startAuction, nextPlayer, placeBid, soldPlayer, unsoldPlayer, undoLastAuction,
      setPhase, resetAuction, setupNewAuction, importPlayers, importTeams, getPlayerById, getTeamById
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error("useAuction must be used within AuctionProvider");
  return context;
};