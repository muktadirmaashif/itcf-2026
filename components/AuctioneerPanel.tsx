import React, { useRef, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { getNextMinBid, canTeamBid } from '../utils/auctionRules';
import { AuctionPhase } from '../types';
import { generateTeamsCSV } from '../utils/csvHelpers';
import { formatCurrency } from '../utils/format';
import { Gavel, CheckCircle, XCircle, ChevronRight, AlertTriangle, Download, History, RotateCcw } from 'lucide-react';

export const AuctioneerPanel = () => {
  const { 
    teams, players, phase, bidState, 
    nextPlayer, placeBid, soldPlayer, unsoldPlayer, undoLastAuction,
    setPhase, getPlayerById
  } = useAuction();

  const bidHistoryRef = useRef<HTMLDivElement>(null);

  const currentPlayer = bidState.currentPlayerId ? getPlayerById(bidState.currentPlayerId) : null;
  
  // Auto-scroll bid history
  useEffect(() => {
    if (bidHistoryRef.current) {
      bidHistoryRef.current.scrollTop = 0;
    }
  }, [bidState.history]);

  // Calculate next valid bid
  const nextMinBid = currentPlayer 
    ? getNextMinBid(bidState.currentBidPrice, currentPlayer.category)
    : 0;

  const handleExportCSV = () => {
    const csvContent = generateTeamsCSV(teams);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auction_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUndo = async () => {
      if(confirm("Are you sure you want to undo the last sold/unsold action? This will bring the player back to current auction.")) {
          try {
              await undoLastAuction();
          } catch(e) {
              alert("Failed to undo.");
          }
      }
  }

  if (phase === AuctionPhase.SETUP) {
    return (
      <div className="grid grid-cols-1 gap-8 h-full">
        {/* Intro Card */}
        <div className="flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700 p-8 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Auction Setup</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Configure teams and player database via "Manage Data" before starting.
            </p>
          </div>
          
          <div className="flex gap-4 text-sm">
             <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700">
                <span className="block text-slate-500 text-xs uppercase">Players</span>
                <span className="text-xl font-bold text-emerald-400">{players.length}</span>
             </div>
             <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700">
                <span className="block text-slate-500 text-xs uppercase">Teams</span>
                <span className="text-xl font-bold text-emerald-400">{teams.length}</span>
             </div>
          </div>

          <button 
            onClick={() => setPhase(AuctionPhase.CATEGORY_A)}
            disabled={players.length === 0 || teams.length < 2}
            className="bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
          >
            Start Auction <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
            {/* Team Management */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> Participating Teams
                  </h3>
                  <button 
                    onClick={handleExportCSV}
                    disabled={teams.length === 0}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-emerald-400 px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {teams.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-700">
                            <span>{t.name}</span>
                            <span className="text-xs text-slate-500">Budget: {formatCurrency(t.budget)}</span>
                        </div>
                    ))}
                    {teams.length === 0 && <p className="text-slate-500 text-sm italic">No teams loaded.</p>}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Player Spotlight & Controls */}
      <div className="lg:col-span-4 space-y-6">
        {currentPlayer ? (
          <PlayerCard player={currentPlayer} isSpotlight />
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center bg-slate-800 rounded-2xl border border-slate-700 border-dashed">
            <p className="text-slate-400 mb-4">No active player</p>
            <button 
              onClick={nextPlayer}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
            >
              Bring Next Player
            </button>
          </div>
        )}

        {/* Control Row: History + Phase Control Side-by-Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Bid History */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-64 xl:h-auto min-h-[16rem]">
               <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <History className="w-4 h-4" /> Bid History
                   </h4>
                   <button 
                      onClick={handleUndo}
                      className="text-amber-500 hover:text-amber-400 p-1 hover:bg-amber-900/20 rounded transition-colors"
                      title="Undo Last Sold/Unsold Action"
                   >
                       <RotateCcw className="w-4 h-4" />
                   </button>
               </div>
               <div ref={bidHistoryRef} className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                 {bidState.history.length === 0 && <p className="text-xs text-slate-500 italic">No bids yet.</p>}
                 {bidState.history.map((h, i) => {
                   const teamName = teams.find(t => t.id === h.teamId)?.name;
                   return (
                     <div key={i} className="flex justify-between text-xs p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="font-medium text-slate-300 truncate max-w-[80px]">{teamName}</span>
                        <span className="font-mono text-emerald-400">{formatCurrency(h.amount)}</span>
                     </div>
                   )
                 })}
               </div>
            </div>

            {/* Phase Control */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between h-64 xl:h-auto min-h-[16rem]">
              <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Phase</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[AuctionPhase.CATEGORY_A, AuctionPhase.CATEGORY_B, AuctionPhase.CATEGORY_C_AUCTION, AuctionPhase.UNSOLD_ROUND, AuctionPhase.COMPLETE].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPhase(p)}
                            className={`px-2 py-1 text-[10px] rounded border w-full text-center truncate ${phase === p ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                        >
                            {p.replace('CATEGORY_', 'CAT ')}
                        </button>
                    ))}
                  </div>
              </div>
              
               <button 
                  onClick={handleExportCSV}
                  className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-emerald-400 px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors border border-slate-600 mt-2"
                >
                  <Download className="w-4 h-4" /> CSV Export
                </button>
            </div>
        </div>
      </div>

      {/* Right Column: Bidding Controls */}
      <div className="lg:col-span-8 space-y-6">
        {/* Current Bid Stats */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between">
           <div>
             <p className="text-slate-400 text-sm">Current Bid</p>
             <p className="text-4xl font-mono font-bold text-white">
               {formatCurrency(bidState.currentBidPrice)}
             </p>
           </div>
           <div>
             <p className="text-slate-400 text-sm text-right">Winning Team</p>
             <p className="text-2xl font-bold text-emerald-400 text-right">
                {teams.find(t => t.id === bidState.currentBidderTeamId)?.name || 'None'}
             </p>
           </div>
        </div>

        {/* Bidding Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {teams.map(team => {
             const validation = currentPlayer ? canTeamBid(team, nextMinBid, currentPlayer, phase) : { allowed: false, reason: "No Player" };
             const isWinning = bidState.currentBidderTeamId === team.id;

             return (
               <button
                 key={team.id}
                 disabled={!currentPlayer || !validation.allowed || isWinning}
                 onClick={() => placeBid(team.id, nextMinBid)}
                 className={`relative p-4 rounded-xl border text-left transition-all ${
                    isWinning 
                    ? 'bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500' 
                    : !validation.allowed
                        ? 'bg-slate-800/50 border-slate-800 opacity-60 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-750'
                 }`}
               >
                 <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-200 truncate pr-2 max-w-[120px]">{team.name}</span>
                    <span className="text-xs font-mono text-slate-400">{formatCurrency(team.budget)}</span>
                 </div>
                 
                 {!validation.allowed && !isWinning && (
                    <div className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{validation.reason?.split(':')[0]}</span>
                    </div>
                 )}

                 {isWinning && (
                    <div className="absolute top-2 right-2 text-xs text-emerald-500 font-bold bg-emerald-950/50 px-2 py-0.5 rounded">
                        LEADING
                    </div>
                 )}

                 {validation.allowed && !isWinning && (
                    <div className="mt-2 text-center py-1 bg-slate-700 rounded text-sm font-medium text-emerald-400">
                        Bid {formatCurrency(nextMinBid)}
                    </div>
                 )}
               </button>
             )
           })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
            <button 
                onClick={soldPlayer}
                disabled={!bidState.currentBidderTeamId}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
                <Gavel className="w-6 h-6" /> SOLD to {teams.find(t => t.id === bidState.currentBidderTeamId)?.name || '...'}
            </button>
            <button 
                onClick={unsoldPlayer}
                disabled={!currentPlayer || !!bidState.currentBidderTeamId}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
                <XCircle className="w-6 h-6" /> Mark UNSOLD
            </button>
        </div>
      </div>
    </div>
  );
};