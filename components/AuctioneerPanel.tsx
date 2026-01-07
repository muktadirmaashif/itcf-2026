
import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { getNextMinBid, canTeamBid } from '../utils/auctionRules';
import { AuctionPhase, PlayerCategory, PlayerStatus } from '../types';
import { formatCurrency } from '../utils/format';
import { Gavel, Play, ChevronRight, AlertTriangle, RotateCcw, Trash2, PlusCircle, Loader2 } from 'lucide-react';

export const AuctioneerPanel = () => {
  const { 
    teams, players, phase, bidState, 
    nextPlayer, placeBid, soldPlayer, unsoldPlayer, undoLastAuction, clearHistory,
    setPhase, getPlayerById, startAuction
  } = useAuction();

  const [isOpening, setIsOpening] = useState(false);
  const currentPlayer = bidState.currentPlayerId ? getPlayerById(bidState.currentPlayerId) : null;
  
  const [customBidTeamId, setCustomBidTeamId] = useState<string>('');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  
  const nextMinBid = currentPlayer 
    ? getNextMinBid(bidState.currentBidPrice, currentPlayer.category)
    : 0;

  const isPhaseExhausted = (p: AuctionPhase): boolean => {
    switch (p) {
      case AuctionPhase.CATEGORY_A:
        return players.filter(pl => pl.category === PlayerCategory.A && pl.status === PlayerStatus.AVAILABLE).length === 0;
      case AuctionPhase.CATEGORY_B:
        return players.filter(pl => pl.category === PlayerCategory.B && pl.status === PlayerStatus.AVAILABLE).length === 0;
      case AuctionPhase.CATEGORY_C_AUCTION:
        return players.filter(pl => pl.category === PlayerCategory.C && pl.status === PlayerStatus.AVAILABLE).length === 0;
      case AuctionPhase.UNSOLD_ROUND:
        return players.filter(pl => pl.status === PlayerStatus.UNSOLD).length === 0;
      default:
        return false;
    }
  };

  const currentPhaseIsExhausted = isPhaseExhausted(phase);

  const handleStartAuction = async () => {
    setIsOpening(true);
    try {
      await startAuction();
    } finally {
      setIsOpening(false);
    }
  };

  const handleManualBid = () => {
    if (!currentPlayer) return;
    const team = teams.find(t => t.id === customBidTeamId);
    const amount = parseInt(customBidAmount);
    
    if (!team || isNaN(amount) || amount <= 0) {
      alert("Please select a valid team and enter a bid amount.");
      return;
    }

    const validation = canTeamBid(team, amount, currentPlayer, phase, bidState);
    if (!validation.allowed) {
      alert(`Bid Rejected: ${validation.reason}`);
      return;
    }

    if (amount <= bidState.currentBidPrice) {
      alert("Custom bid must be higher than current bid.");
      return;
    }

    placeBid(customBidTeamId, amount);
    setCustomBidAmount(''); 
    setCustomBidTeamId('');
  };

  if (phase === AuctionPhase.SETUP) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-800 rounded-xl p-12 text-center h-[500px]">
          <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-widest leading-tight">Auction Floor Closed</h2>
          <button 
            onClick={handleStartAuction}
            disabled={isOpening}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center gap-3"
          >
            {isOpening ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
            {isOpening ? 'OPENING...' : 'OPEN AUCTION'}
          </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
        {Object.values(AuctionPhase).filter(p => p !== AuctionPhase.SETUP && p !== AuctionPhase.COMPLETE).map((p) => {
          const exhausted = isPhaseExhausted(p as AuctionPhase);
          const isCurrent = phase === p;
          return (
            <button
              key={p}
              disabled={(exhausted && !isCurrent) || !!currentPlayer}
              onClick={() => setPhase(p as AuctionPhase)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                isCurrent ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 
                exhausted ? 'text-slate-600 cursor-not-allowed opacity-40' : 
                (!!currentPlayer ? 'text-slate-600 opacity-40 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800')
              }`}
            >
              {p.replace(/_/g, ' ')}
            </button>
          );
        })}
        <div className="h-6 w-px bg-slate-700 mx-2"></div>
        <button onClick={undoLastAuction} disabled={!!currentPlayer} className="px-4 py-2 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-900/20 rounded-xl"><RotateCcw className="w-3 h-3" /> Undo</button>
        <button onClick={() => confirm('Clear history?') && clearHistory()} disabled={!!currentPlayer} className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-white rounded-xl"><Trash2 className="w-3 h-3" /> Clear</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {currentPlayer ? (
            <div>
              <PlayerCard player={currentPlayer} isSpotlight />
              <div className="mt-6 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
                 <div className="flex items-center gap-2 mb-4 text-emerald-400"><PlusCircle className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Custom Bid</span></div>
                 <div className="space-y-3">
                    <select value={customBidTeamId} onChange={(e) => setCustomBidTeamId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white">
                      <option value="">Select Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="number" placeholder="Amount" value={customBidAmount} onChange={(e) => setCustomBidAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
                    <button onClick={handleManualBid} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px]">Place Bid</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-[340px] flex flex-col items-center justify-center bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 p-8 text-center">
                <p className="text-slate-500 text-sm font-bold uppercase mb-6">{currentPhaseIsExhausted ? 'Phase Complete' : 'Lot Empty'}</p>
                <button onClick={nextPlayer} disabled={currentPhaseIsExhausted} className="w-full px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">CALL NEXT LOT</button>
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {teams.map(team => {
               const validation = currentPlayer ? canTeamBid(team, nextMinBid, currentPlayer, phase, bidState) : { allowed: false };
               const isWinning = bidState.currentBidderTeamId === team.id;
               return (
                 <button key={team.id} disabled={!currentPlayer || !validation.allowed} onClick={() => placeBid(team.id, nextMinBid)} className={`p-4 rounded-xl border text-left transition-all ${isWinning ? 'bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-800 border-slate-700 opacity-90 hover:border-emerald-500/50'}`}>
                   <span className="font-black text-white text-xs uppercase block truncate">{team.name}</span>
                   <span className="text-[10px] font-mono text-emerald-400">{formatCurrency(team.budget)}</span>
                   <div className="mt-3 text-center py-2 bg-slate-900 rounded-lg text-[9px] font-black uppercase text-emerald-500 border border-emerald-500/10">BID {formatCurrency(nextMinBid)}</div>
                 </button>
               )
             })}
           </div>
           <div className="flex gap-4 mt-8">
              <button onClick={soldPlayer} disabled={!currentPlayer || !bidState.currentBidderTeamId} className="flex-1 bg-emerald-600 py-5 rounded-2xl font-black text-xl text-white shadow-xl">SOLD</button>
              <button onClick={unsoldPlayer} disabled={!currentPlayer || !!bidState.currentBidderTeamId} className="flex-1 bg-rose-600 py-5 rounded-2xl font-black text-xl text-white shadow-xl">UNSOLD</button>
           </div>
        </div>
      </div>
    </div>
  );
};
