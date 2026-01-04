import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCategory, PlayerStatus } from '../types';
import { Users, Crown, Trophy, Gavel, User, Activity, Zap, ClipboardList } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const Dashboard = () => {
  const { teams, players, bidState, getPlayerById, getTeamById, lastProcessedId } = useAuction();

  // --- Statistics Calculation ---
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD && p.soldPrice !== undefined);
  const mostExpensivePlayer = soldPlayers.length > 0 
    ? soldPlayers.reduce((prev, current) => (prev.soldPrice || 0) > (current.soldPrice || 0) ? prev : current, soldPlayers[0])
    : null;

  const sortedBySpend = [...teams].sort((a, b) => b.spent - a.spent);
  const topSpender = sortedBySpend[0];
  const hasSpending = topSpender && topSpender.spent > 0;

  // --- Live Auction / Last Result State ---
  const currentPlayer = bidState.currentPlayerId ? getPlayerById(bidState.currentPlayerId) : null;
  const lastPlayer = lastProcessedId ? getPlayerById(lastProcessedId) : null;

  return (
    <div className="space-y-8">
      
      {/* Live Auction Card */}
      <div className="grid grid-cols-1 gap-6">
          {currentPlayer ? (
            <div className="bg-slate-800 rounded-2xl border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden transition-all duration-500 transform hover:scale-[1.01]">
                {/* Dynamic Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                           <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                           <span className="text-xs font-black tracking-[0.2em] text-white uppercase">Live Auction</span>
                        </div>
                        <Gavel className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                        <span className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-white border border-white/20">
                            Category {currentPlayer.category}
                        </span>
                    </div>
                </div>

                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-10">
                    {/* Player Info Section */}
                    <div className="flex flex-col group text-center md:text-left">
                        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                             <Zap className="w-5 h-5 text-emerald-400" />
                             <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-sm">{currentPlayer.role}</span>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tight leading-none mb-4">{currentPlayer.name}</h2>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <span className="text-slate-500 font-medium text-sm">PLAYER ID: {currentPlayer.id}</span>
                            <div className="h-1 w-1 rounded-full bg-slate-600"></div>
                            <span className="text-slate-500 font-medium text-sm">BASE PRICE: {formatCurrency(currentPlayer.basePrice)}</span>
                        </div>
                    </div>
                    
                    {/* Bidding Stats Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <div className="text-center md:text-right px-4">
                            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Current Bid</p>
                            <div className="relative inline-block">
                                <p className="text-6xl font-mono font-black text-emerald-400 leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-[pulse_2s_ease-in-out_infinite]">
                                    {formatCurrency(bidState.currentBidPrice)}
                                </p>
                            </div>
                        </div>

                        <div className="h-16 w-px bg-slate-700 hidden md:block"></div>
                        <div className="w-full md:w-auto h-px md:h-auto bg-slate-700 block md:hidden"></div>

                        <div className="text-center md:text-left px-4 min-w-[200px]">
                            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Winning Team</p>
                            {bidState.currentBidderTeamId ? (
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-white leading-tight">
                                        {getTeamById(bidState.currentBidderTeamId)?.name}
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-1">
                                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                            In Control
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-2xl font-bold text-slate-600 italic">No Bids Yet</p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer Progress/Info */}
                <div className="bg-slate-900/80 px-8 py-3 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                             Squad limitations and budget rules enforced in real-time.
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Activity className="w-3 h-3" />
                        <span>Real-time sync active</span>
                    </div>
                </div>
            </div>
          ) : lastPlayer ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden opacity-90 transition-all duration-300">
                <div className="bg-slate-700/50 px-6 py-2.5 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> Recent Activity</span>
                    <span className="text-slate-500">Standby for next slot</span>
                </div>
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center border border-white/5">
                            <User className="w-7 h-7 text-slate-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{lastPlayer.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">{lastPlayer.role}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">CAT {lastPlayer.category}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Result</p>
                             <p className={`text-xl font-black px-3 py-1 rounded-lg ${lastPlayer.status === PlayerStatus.SOLD ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                                {lastPlayer.status}
                             </p>
                        </div>
                        {lastPlayer.status === PlayerStatus.SOLD && (
                            <>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Acquired By</p>
                                    <p className="text-xl font-black text-white">{getTeamById(lastPlayer.soldToTeamId || '')?.name || '---'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Final Price</p>
                                    <p className="text-2xl font-mono font-black text-emerald-400 tracking-tighter">{formatCurrency(lastPlayer.soldPrice || 0)}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-3xl border border-slate-700/50 border-dashed p-16 text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-full mb-6 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                    <Gavel className="w-10 h-10 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Arena is Silent</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto">The gavel is resting. We're waiting for the auctioneer to bring the next player to the stage.</p>
            </div>
          )}
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Spender */}
          <div className="bg-gradient-to-br from-indigo-900/80 to-slate-900 p-8 rounded-3xl border border-indigo-500/30 flex items-center justify-between relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-48 h-48 -rotate-12" />
             </div>
             <div className="relative z-10">
                 <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    Market Aggressor
                 </p>
                 <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{hasSpending ? topSpender.name : '--'}</h2>
                 <div className="flex gap-3">
                    <div className="bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                        <span className="text-indigo-300 text-[10px] font-bold uppercase mr-2">Squad</span>
                        <span className="text-white font-black">{hasSpending ? topSpender.players.length : '-'}</span>
                    </div>
                    <div className="bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                        <span className="text-indigo-300 text-[10px] font-bold uppercase mr-2">Balance</span>
                        <span className="text-white font-black font-mono">{hasSpending ? formatCurrency(topSpender.budget) : '-'}</span>
                    </div>
                 </div>
             </div>
             <div className="text-right relative z-10">
                 <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">Total Investment</p>
                 <p className="text-5xl font-mono font-black text-white tracking-tighter">{hasSpending ? formatCurrency(topSpender.spent) : '-'}</p>
             </div>
          </div>

          {/* Most Expensive Player */}
          <div className="bg-gradient-to-br from-amber-900/80 to-slate-900 p-8 rounded-3xl border border-amber-500/30 flex items-center justify-between relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Crown className="w-48 h-48 rotate-12" />
             </div>
             <div className="relative z-10">
                 <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    MVP Acquisition
                 </p>
                 <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{mostExpensivePlayer ? mostExpensivePlayer.name : '--'}</h2>
                 <div className="flex gap-3">
                    <div className="bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                        <span className="text-amber-300 text-[10px] font-bold uppercase mr-2">Role</span>
                        <span className="text-white font-black">{mostExpensivePlayer ? mostExpensivePlayer.role : '-'}</span>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                        <span className="text-amber-300 text-[10px] font-bold uppercase mr-2">Owner</span>
                        <span className="text-white font-black">{mostExpensivePlayer ? (teams.find(t => t.id === mostExpensivePlayer.soldToTeamId)?.name || '-') : '-'}</span>
                    </div>
                 </div>
             </div>
             <div className="text-right relative z-10">
                 <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">Record Fee</p>
                 <p className="text-5xl font-mono font-black text-white tracking-tighter">{mostExpensivePlayer ? formatCurrency(mostExpensivePlayer.soldPrice || 0) : '-'}</p>
             </div>
          </div>
      </div>

      {/* Teams Overview Cards */}
      <div>
        <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Team Standings</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map(team => (
            <div key={team.id} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-all group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-xl text-white truncate pr-2">{team.name}</h3>
                    <div className="p-2 bg-slate-900 rounded-xl border border-white/5">
                        <Users className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                </div>
                
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Squad Size</p>
                        <p className="text-2xl font-black text-white">{team.players.length} <span className="text-sm text-slate-600 font-medium">/ 15</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Remaining</p>
                        <p className="text-xl font-mono font-black text-emerald-400 tracking-tighter">{formatCurrency(team.budget)}</p>
                    </div>
                </div>

                {/* Squad Composition */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="text-center p-2 rounded-xl bg-slate-900/50 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">A</p>
                        <p className={`text-sm font-black ${team.categoryCounts.A < 1 ? 'text-rose-500' : 'text-white'}`}>{team.categoryCounts.A}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-slate-900/50 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">B</p>
                        <p className={`text-sm font-black ${team.categoryCounts.B < 4 ? 'text-amber-500' : 'text-white'}`}>{team.categoryCounts.B}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-slate-900/50 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">C</p>
                        <p className={`text-sm font-black ${team.categoryCounts.C < 7 ? 'text-slate-400' : 'text-white'}`}>{team.categoryCounts.C}</p>
                    </div>
                </div>

                {/* Roster List Section */}
                <div className="mb-6 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Team Roster</span>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl border border-white/5 p-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {team.players.length > 0 ? (
                            <div className="space-y-1">
                                {team.players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-800/50 rounded-lg border border-white/[0.02] hover:bg-slate-700 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-md ${p.category === 'A' ? 'bg-rose-500 text-white' : p.category === 'B' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
                                                {p.category}
                                            </span>
                                            <span className="text-xs font-bold text-slate-300 truncate">{p.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-emerald-400 ml-2">
                                            {formatCurrency(p.soldPrice || 0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Squad Empty</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-auto">
                    <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className={`h-full transition-all duration-1000 ${team.spent > 100000 ? 'bg-rose-500' : team.spent > 60000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(team.spent / 120000) * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[8px] text-slate-600 font-black uppercase">Spent Capacity</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase">{Math.round((team.spent / 120000) * 100)}%</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};