

import { supabase } from '../utils/supabaseClient';
import { Player, Team, AuctionPhase, PlayerStatus, BidState } from '../types';

/**
 * TPL Auction API Service
 * Centralized logic for all auction state transitions.
 */
export const AuctionService = {
  /**
   * Fetches the entire application state in a single transaction-like call
   */
  async getInitialState() {
    const [teams, players, state] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*'),
      supabase.from('auction_state').select('*').eq('id', 1).maybeSingle()
    ]);

    if (teams.error || players.error || state.error) {
      throw new Error(`API Sync Failure: ${teams.error?.message || players.error?.message || state.error?.message}`);
    }

    return { 
      teams: teams.data, 
      players: players.data, 
      state: state.data 
    };
  },

  /**
   * Updates a team's budget and category stats
   */
  async updateTeamFinances(teamId: string, updates: Partial<Team>) {
    const { error } = await supabase
      .from('teams')
      .update({
        budget: updates.budget,
        spent: updates.spent,
        category_counts: updates.categoryCounts,
        category_spend: updates.category_spend
      })
      .eq('id', teamId);
    if (error) throw error;
  },

  /**
   * Transitions the auction phase
   */
  async setPhase(phase: AuctionPhase) {
    const { error } = await supabase
      .from('auction_state')
      .update({ phase, current_player_id: null, current_bid_price: 0, current_bidder_team_id: null })
      .eq('id', 1);
    if (error) throw error;
  },

  /**
   * Records a bid in the global state
   */
  async recordBid(amount: number, teamId: string, history: any[]) {
    const { error } = await supabase
      .from('auction_state')
      .update({ 
        current_bid_price: amount, 
        current_bidder_team_id: teamId, 
        history 
      })
      .eq('id', 1);
    if (error) throw error;
  },

  /**
   * Finalizes a sale
   */
  async sellPlayer(playerId: string, teamId: string, price: number, history: any[]) {
    const { error: playerErr } = await supabase
      .from('players')
      .update({ status: PlayerStatus.SOLD, sold_price: price, sold_to_team_id: teamId })
      .eq('id', playerId);
    
    if (playerErr) throw playerErr;

    const { error: stateErr } = await supabase
      .from('auction_state')
      .update({ 
        current_player_id: null, 
        current_bid_price: 0, 
        current_bidder_team_id: null, 
        history 
      })
      .eq('id', 1);

    if (stateErr) throw stateErr;
  },

  /**
   * Resets the entire database state
   */
  async resetSystem(keepCoreData: boolean = true) {
    await supabase.from('auction_state').update({
      phase: AuctionPhase.SETUP,
      current_player_id: null,
      current_bid_price: 0,
      current_bidder_team_id: null,
      // Reset interest state fields
      is_interest_locked: false,
      interests: {},
      history: []
    }).eq('id', 1);

    await supabase.from('players').update({
      status: PlayerStatus.AVAILABLE,
      sold_price: null,
      sold_to_team_id: null
    }).neq('id', 'placeholder');

    await supabase.from('teams').update({
      budget: 120000,
      spent: 0,
      category_counts: { A: 0, B: 0, C: 0 },
      category_spend: { A: 0, B: 0, C: 0 }
    }).neq('id', 'placeholder');
  }
};