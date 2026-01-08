
import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { getNextMinBid, canTeamBid } from '../utils/auctionRules';
import { AuctionPhase, PlayerCategory, PlayerStatus } from '../types';
import { formatCurrency } from '../utils/format';
import { 
  ChevronRight, 
  RotateCcw, 
  Trash2, 
  PlusCircle, 
  Loader2, 
  Trophy, 
  AlertCircle 
} from 'lucide-react';

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
    ? getNextMinBid(bidState.currentBidPrice, currentPlayer.category, bidState.currentBidderTeamId)
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
      <div className="flex flex-col items-center justify-center bg-slate-800 rounded-xl p-12 text-center h-[500px] border-2 border-dashed border-slate-700 shadow-inner">
          <div className="w-20 h-20 bg-emerald-950/40 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Auction Floor Closed</h2>
          <p className="text-slate-400 mb-8 max-w-sm">Initialize the TPL Season 3 Auction by opening the first phase.</p>
          <button 
            onClick={handleStartAuction}
            disabled={isOpening}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center gap-3 shadow-emerald-500/20"
          >
            {isOpening ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
            {isOpening ? 'INITIALIZING...' : 'OPEN AUCTION FLOOR'}
          </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undoLastAuction} disabled={!!currentPlayer} className="px-4 py-2 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-900/20 rounded-xl flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3" /> Undo Last</button>
          <div className="h-6 w-px bg-slate-700"></div>
          <button onClick={() => confirm('Clear all session history?') && clearHistory()} disabled={!!currentPlayer} className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-white rounded-xl flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Clear History</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Spotlight Player Card */}
        <div className="lg:col-span-4 space-y-6">
          {currentPlayer ? (
            <div className="animate-in slide-in-from-left-4 duration-500">
              <PlayerCard player={currentPlayer} isSpotlight />
              <div className="mt-6 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
                 <div className="flex items-center gap-2 mb-4 text-emerald-400">
                   <PlusCircle className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Manual Override Bid</span>
                 </div>
                 <div className="space-y-3">
                    <select 
                      value={customBidTeamId} 
                      onChange={(e) => setCustomBidTeamId(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="">Select Bidding Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Enter Exact Amount" 
                      value={customBidAmount} 
                      onChange={(e) => setCustomBidAmount(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" 
                    />
                    <button onClick={handleManualBid} className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Submit Bid</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-[360px] flex flex-col items-center justify-center bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-700 p-8 text-center shadow-inner">
                <AlertCircle className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-500 text-sm font-bold uppercase mb-6 tracking-widest">
                  {currentPhaseIsExhausted ? 'All Phase Players Exhausted' : 'Lot is currently empty'}
                </p>
                <button 
                  onClick={nextPlayer} 
                  disabled={currentPhaseIsExhausted} 
                  className="w-full px-10 py-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-30 disabled:grayscale text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest"
                >
                  {currentPhaseIsExhausted ? 'PHASE COMPLETE' : 'DRAW NEXT LOT'}
                </button>
            </div>
          )}
        </div>

        {/* Bidding Grid */}
        <div className="lg:col-span-8 flex flex-col h-full">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-auto">
             {teams.map(team => {
               const validation = currentPlayer ? canTeamBid(team, nextMinBid, currentPlayer, phase, bidState) : { allowed: false };
               const isWinning = bidState.currentBidderTeamId === team.id;
               
               return (
                 <button 
                   key={team.id} 
                   disabled={!currentPlayer || !validation.allowed || isWinning} 
                   onClick={() => placeBid(team.id, nextMinBid)} 
                   className={`relative p-5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                     isWinning 
                      ? 'bg-emerald-950/80 border-emerald-400 ring-4 ring-emerald-500/40 scale-[1.03] z-10 shadow-2xl !opacity-100' 
                      : 'bg-slate-800 border-slate-700/50 hover:border-emerald-500/50 hover:scale-[1.01] disabled:opacity-30'
                   }`}
                   style={{ opacity: isWinning ? 1 : undefined }}
                 >
                   <div className="flex justify-between items-start mb-2 relative z-10">
                     <span className={`font-black text-xs uppercase block truncate tracking-tight ${isWinning ? 'text-white' : 'text-slate-300'}`}>
                        {team.name}
                     </span>
                     {isWinning && (
                        <div className="bg-emerald-500 text-white p-1 rounded-md animate-bounce">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                     )}
                   </div>

                   <div className="flex flex-col mb-4 relative z-10">
                     <span className={`text-[9px] uppercase font-black tracking-widest mb-0.5 ${isWinning ? 'text-emerald-400/70' : 'text-slate-500'}`}>Remaining Budget</span>
                     <span className={`text-sm font-mono font-black ${isWinning ? 'text-white' : 'text-emerald-500'}`}>
                       {formatCurrency(team.budget)}
                     </span>
                   </div>

                   <div className={`mt-auto text-center py-3 rounded-xl text-[10px] font-black uppercase border transition-all relative z-10 ${
                     isWinning 
                       ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' 
                       : 'bg-slate-900 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white'
                   }`}>
                     {isWinning ? 'HOLDING HIGHEST BID' : `${!bidState.currentBidderTeamId ? 'OPEN AT' : 'BID'} ${formatCurrency(nextMinBid)}`}
                   </div>

                   {/* Decorative elements for winning state */}
                   {isWinning && (
                     <>
                       <div className="absolute top-0 left-0 bg-emerald-400 text-emerald-950 px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-br-xl shadow-md z-20">
                         CURRENT LEADER
                       </div>
                       <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                     </>
                   )}
                 </button>
               )
             })}
           </div>

           {/* Call Actions */}
           <div className="flex flex-col sm:flex-row gap-4 mt-8 sticky bottom-0 bg-slate-900/80 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
              <button 
                onClick={soldPlayer} 
                disabled={!currentPlayer || !bidState.currentBidderTeamId} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-20 disabled:grayscale py-5 rounded-2xl font-black text-2xl text-white shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Trophy className="w-8 h-8" /> SOLD
              </button>
              <button 
                onClick={unsoldPlayer} 
                disabled={!currentPlayer || !!bidState.currentBidderTeamId} 
                className="flex-1 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-20 disabled:grayscale py-5 rounded-2xl font-black text-2xl text-white shadow-xl shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <AlertCircle className="w-8 h-8" /> UNSOLD
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
