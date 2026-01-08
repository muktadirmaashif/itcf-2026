
import React, { useRef, useEffect, useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus, Player, Team } from '../types';
import { Crown, Trophy, Gavel, Zap, ClipboardList, History, Sparkles, User, Ban, TrendingUp, Shield, Star } from 'lucide-react';
import { formatCurrency, getPlayerImagePath } from '../utils/format';

const CelebrationEffect = () => {
  const [sparkles, setSparkles] = useState<{ id: number; left: string; size: string; delay: string; color: string }[]>([]);

  useEffect(() => {
    const newSparkles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 12 + 4}px`,
      delay: `${Math.random() * 2}s`,
      color: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff'][Math.floor(Math.random() * 5)]
    }));
    setSparkles(newSparkles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            animationDelay: s.delay,
            boxShadow: `0 0 10px ${s.color}`
          }}
        />
      ))}
    </div>
  );
};

interface RosterItemProps {
  player: Player;
}

const RosterItem: React.FC<RosterItemProps> = ({ player }) => {
  const [error, setError] = useState(false);
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
      <div className="min-w-0 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0 flex items-center justify-center relative">
          {!error ? (
            <img 
              src={getPlayerImagePath(player)} 
              alt=""
              loading="lazy"
              className="w-full h-full object-cover z-10"
              onError={() => setError(true)}
            />
          ) : (
            <User className="w-4 h-4 text-slate-600" />
          )}
        </div>
        <div className="truncate">
          <p className="text-[10px] font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">{player.name}</p>
          <p className="text-[8px] text-slate-500 uppercase font-bold">{player.role}</p>
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold text-emerald-400/80 tabular-nums ml-2">{formatCurrency(player.soldPrice || 0)}</span>
    </div>
  );
};

export const Dashboard = () => {
  const { teams, players, bidState, getPlayerById, getTeamById, lastProcessedId } = useAuction();
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [currentImgError, setCurrentImgError] = useState(false);
  const [lastImgError, setLastImgError] = useState(false);
  
  const [mvpGlow, setMvpGlow] = useState(false);
  const [spenderGlow, setSpenderGlow] = useState(false);
  
  const prevMvpId = useRef<string | null>(null);
  const prevSpenderId = useRef<string | null>(null);
  const prevSpenderAmount = useRef<number>(0);

  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD && p.soldPrice !== undefined);
  const mostExpensivePlayer = soldPlayers.length > 0 
    ? soldPlayers.reduce((prev, curr) => (prev.soldPrice || 0) > (curr.soldPrice || 0) ? prev : curr)
    : null;

  const sortedTeams = [...teams].sort((a, b) => b.spent - a.spent);
  const topSpender = sortedTeams[0];

  useEffect(() => { setCurrentImgError(false); }, [bidState.currentPlayerId]);
  useEffect(() => { setLastImgError(false); }, [lastProcessedId]);

  useEffect(() => {
    if (mostExpensivePlayer && mostExpensivePlayer.id !== prevMvpId.current) {
      setMvpGlow(true);
      setTimeout(() => setMvpGlow(false), 2000);
      prevMvpId.current = mostExpensivePlayer.id;
    }

    if (topSpender && (topSpender.id !== prevSpenderId.current || topSpender.spent !== prevSpenderAmount.current)) {
      setSpenderGlow(true);
      setTimeout(() => setSpenderGlow(false), 2000);
      prevSpenderId.current = topSpender.id;
      prevSpenderAmount.current = topSpender.spent;
    }
  }, [mostExpensivePlayer?.id, topSpender?.id, topSpender?.spent]);

  useEffect(() => {
    if (bidState.history.length > 0) {
      const latest = bidState.history[0] as any;
      const team = getTeamById(latest.teamId);
      
      let msg = "";
      if (latest.type === 'sold') {
        msg = `LOT SOLD: ${latest.playerName} to ${team?.name} for ${formatCurrency(latest.amount)}`;
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
      else if (latest.type === 'unsold') msg = `LOT PASSED: ${latest.playerName} remains unsold.`;
      else if (latest.type === 'bid') msg = `${team?.name} bid ${formatCurrency(latest.amount)}`;

      if (msg) {
        setToast({ msg, type: latest.type });
        const timer = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [bidState.history[0]?.timestamp]);

  useEffect(() => {
    if (historyScrollRef.current) historyScrollRef.current.scrollTop = 0;
  }, [bidState.history]);

  const currentPlayer = bidState.currentPlayerId ? getPlayerById(bidState.currentPlayerId) : null;
  const lastPlayer = lastProcessedId ? getPlayerById(lastProcessedId) : null;

  return (
    <div className="space-y-8 w-full relative">
      {showCelebration && <CelebrationEffect />}
      
      {toast && (
        <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-sm">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 ${
             toast.type === 'sold' ? 'bg-emerald-900/90 border-emerald-500 text-white' : 
             toast.type === 'bid' ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/90 border-slate-700 text-slate-200'
           }`}>
              <Zap className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest leading-tight">{toast.msg}</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="hidden lg:col-span-3 lg:flex flex-col h-[480px]">
            <div className="flex-1 bg-slate-800/40 rounded-2xl border border-slate-700/50 relative overflow-hidden flex flex-col shadow-lg">
                <History className="absolute -bottom-4 -right-4 w-32 h-32 text-slate-500/5 rotate-12" />
                <div className="relative z-10 flex flex-col h-full overflow-hidden">
                    <div className="p-5 border-b border-white/[0.03] flex items-center justify-between flex-shrink-0">
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Session Log
                      </p>
                      <span className="text-[10px] font-mono text-slate-500">{bidState.history.length} events</span>
                    </div>

                    <div ref={historyScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                        {bidState.history.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-12">
                              <History className="w-12 h-12 mb-3 text-slate-500" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Awaiting First Bid</p>
                           </div>
                        ) : (
                          bidState.history.map((h: any, i) => {
                            const team = getTeamById(h.teamId);
                            const isSold = h.type === 'sold';
                            const isUnsold = h.type === 'unsold';
                            return (
                              <div key={i} className={`relative p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-500 ${
                                isSold ? 'bg-emerald-950/20 border-emerald-500/30' : 
                                isUnsold ? 'bg-rose-950/20 border-rose-500/30' : 
                                'bg-slate-900/40 border-white/[0.05]'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                                    isSold ? 'bg-emerald-500/20 text-emerald-400' : 
                                    isUnsold ? 'bg-rose-500/20 text-rose-400' : 
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {isSold ? <Gavel className="w-3 h-3" /> : isUnsold ? <Ban className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-[10px] font-black uppercase tracking-wider truncate max-w-[120px] ${isSold ? 'text-emerald-400' : 'text-slate-300'}`}>
                                        {team?.name || (h.teamId === 'SYSTEM' ? 'AUCTIONEER' : 'Team')}
                                      </span>
                                      <span className="text-[8px] font-mono text-slate-600">
                                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-200 leading-snug">
                                      {isSold ? 'ACQUIRED ' : isUnsold ? 'PASSED ' : 'PLACED BID FOR '}
                                      <span className="text-teal-400 font-bold">{h.playerName || 'Lot'}</span>
                                    </p>
                                    {h.amount && (
                                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                                        isSold ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-emerald-400'
                                      }`}>
                                        {formatCurrency(h.amount)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-6 h-[480px]">
            {currentPlayer ? (
                <div className="bg-slate-800 rounded-2xl border-2 shadow-2xl h-full flex flex-col overflow-hidden animate-live-glow transition-all duration-500">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Live Auction Feed</span>
                        </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                        
                        <div className="flex items-center gap-8 mb-10 relative z-10 px-2">
                            <div className="w-32 h-32 lg:w-44 lg:h-44 rounded-full border-4 border-emerald-500/30 overflow-hidden shadow-2xl bg-slate-900 flex-shrink-0 flex items-center justify-center group">
                               {!currentImgError ? (
                                 <img 
                                   src={getPlayerImagePath(currentPlayer)} 
                                   alt={currentPlayer.name}
                                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                   onError={() => setCurrentImgError(true)}
                                 />
                               ) : (
                                 <div className="flex items-center justify-center w-full h-full bg-slate-800">
                                    <User className="w-16 h-16 text-slate-600" />
                                 </div>
                               )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <Zap className="w-6 h-6 text-emerald-400 mb-3 animate-bounce" />
                                <h2 className="text-3xl lg:text-5xl font-black text-white uppercase mb-2 leading-none tracking-tighter truncate">{currentPlayer.name}</h2>
                                <p className="text-slate-500 font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                                  <Shield className="w-3 h-3 text-emerald-600" /> {currentPlayer.role} <span className="text-slate-700">•</span> <span className="text-emerald-500 font-black">CAT {currentPlayer.category}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-inner relative z-10 w-full">
                            <div className="border-r border-white/5 pr-4 flex flex-col justify-center">
                                <p className="text-slate-500 text-[10px] uppercase font-black mb-1 tracking-widest">Current Bid</p>
                                <p className="text-2xl lg:text-4xl font-mono font-black text-emerald-400 tabular-nums">{formatCurrency(bidState.currentBidPrice)}</p>
                            </div>
                            <div className="pl-4 flex flex-col justify-center">
                                <p className="text-slate-500 text-[10px] uppercase font-black mb-1 tracking-widest">Current Leader</p>
                                <p className="text-lg lg:text-2xl font-black text-white px-1 leading-tight truncate">
                                  {bidState.currentBidderTeamId ? getTeamById(bidState.currentBidderTeamId)?.name : '---'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : lastPlayer ? (
                <div className={`bg-slate-800 rounded-2xl border ${lastPlayer.status === PlayerStatus.SOLD ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-700'} h-full flex flex-col justify-center text-center p-8 shadow-xl transition-all duration-500`}>
                    <h2 className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Last Lot Summary</h2>
                    
                    <div className="mb-6 mx-auto w-24 h-24 rounded-full border-2 border-slate-700 overflow-hidden shadow-xl bg-slate-900 flex items-center justify-center relative">
                        {!lastImgError ? (
                          <img 
                            src={getPlayerImagePath(lastPlayer)} 
                            alt={lastPlayer.name}
                            className="w-full h-full object-cover"
                            onError={() => setLastImgError(true)}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-slate-800">
                            <User className="w-10 h-10 text-slate-600" />
                          </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-6">
                      <h3 className="text-3xl lg:text-4xl font-black text-white uppercase leading-none tracking-tight">{lastPlayer.name}</h3>
                      {lastPlayer.status === PlayerStatus.SOLD && <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto w-full">
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-center min-h-[120px]">
                            <p className="text-[10px] text-slate-500 font-black mb-2 uppercase tracking-widest text-center">ROLE</p>
                            <p className="text-white font-black text-lg uppercase truncate text-center">{lastPlayer.role}</p>
                        </div>
                        <div className={`bg-slate-900/80 p-6 rounded-2xl border ${lastPlayer.status === PlayerStatus.SOLD ? 'border-emerald-500/20' : 'border-white/5'} shadow-lg flex flex-col justify-center min-h-[120px]`}>
                            <p className="text-[10px] text-slate-500 font-black mb-2 uppercase tracking-widest text-center">TEAM</p>
                            <p className="text-emerald-400 font-black text-lg uppercase truncate leading-tight text-center">{lastPlayer.status === PlayerStatus.SOLD ? getTeamById(lastPlayer.soldToTeamId!)?.name : 'UNSOLD'}</p>
                        </div>
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-center min-h-[120px]">
                            <p className="text-[10px] text-slate-500 font-black mb-2 uppercase tracking-widest text-center">PRICE</p>
                            <p className="text-white font-mono font-black text-lg text-center">{lastPlayer.soldPrice ? formatCurrency(lastPlayer.soldPrice) : <span className="text-slate-600">---</span>}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.5em] mt-2 animate-pulse">Awaiting Next Player</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-3xl border border-dashed border-slate-700 h-full flex flex-col justify-center text-center p-12 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-900/50 blur-[80px] rounded-full"></div>
                    <Gavel className="w-16 h-16 text-slate-700 mx-auto mb-6 relative z-10" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] leading-none relative z-10">THERAP PREMIER LEAGUE</h2>
                    <p className="text-emerald-500 font-black text-sm tracking-[0.4em] mt-3 uppercase relative z-10">Season 3 2026</p>
                </div>
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4 h-[480px]">
              <div className={`flex-1 bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden flex flex-col justify-center text-indigo-400 transition-all ${spenderGlow ? 'animate-highlight-glow ring-2 ring-indigo-500/50' : ''}`}>
                 <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500/10 rotate-12" />
                 <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">High Spender</p>
                 <h2 className="text-xl font-black text-white mb-1 truncate uppercase tracking-tighter">{topSpender?.name || '---'}</h2>
                 <p className="text-4xl font-mono font-black text-white tracking-tighter tabular-nums">{formatCurrency(topSpender?.spent || 0)}</p>
              </div>
              <div className={`flex-1 bg-gradient-to-br from-amber-900/40 to-slate-900 p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden flex flex-col justify-center text-amber-400 transition-all ${mvpGlow ? 'animate-highlight-glow ring-2 ring-amber-500/50' : ''}`}>
                 <Crown className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-500/10 -rotate-12" />
                 <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">MVP Acquisition</p>
                 <h2 className="text-xl font-black text-white mb-1 truncate uppercase tracking-tighter">{mostExpensivePlayer?.name || '---'}</h2>
                 <p className="text-4xl font-mono font-black text-white tracking-tighter tabular-nums">{formatCurrency(mostExpensivePlayer?.soldPrice || 0)}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-10">
          {teams.map(team => {
            const abSpend = team.categorySpend.A + team.categorySpend.B;
            const isLatestBuyer = bidState.history[0]?.type === 'sold' && bidState.history[0]?.teamId === team.id;
            return (
              <div key={team.id} className={`bg-slate-800/40 p-6 rounded-3xl border transition-all duration-1000 flex flex-col h-full shadow-lg ${
                isLatestBuyer ? 'border-emerald-500 shadow-emerald-500/20 bg-emerald-950/20 scale-[1.02]' : 'border-slate-700/50'
              }`}>
                  <div className="flex justify-between items-start mb-6">
                      <div className="min-w-0">
                        <h3 className="font-black text-xl text-white truncate leading-none uppercase tracking-tighter mb-1">{team.name}</h3>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded-md font-black uppercase border border-white/5">{team.players.length} / 15</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                          <p className="text-[8px] text-slate-500 font-black uppercase mb-1 tracking-widest">Budget</p>
                          <p className="text-sm font-mono font-black text-emerald-400 tabular-nums">{formatCurrency(team.budget)}</p>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                          <p className="text-[8px] text-slate-500 font-black uppercase mb-1 tracking-widest">A+B Spend</p>
                          <p className="text-xs font-mono font-black text-indigo-400 truncate tabular-nums">
                            {formatCurrency(abSpend).replace('BDT','')} / 75k
                          </p>
                      </div>
                  </div>
                  <div className="flex-1 mb-6 flex flex-col">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <ClipboardList className="w-3 h-3" /> Active Roster
                      </p>
                      <div className="bg-slate-900/50 rounded-2xl p-3 flex-1 border border-white/5">
                          {/* Captain Entry at the beginning of the list */}
                          <div className="flex items-center gap-3 py-2 border-b border-emerald-500/30 -mx-2 px-2 mb-2 rounded-t-xl bg-emerald-500/5">
                             <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                <Crown className="w-4 h-4" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest truncate">{team.captain || 'TEAM CAPTAIN'}</p>
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Assigned Leader</p>
                             </div>
                          </div>

                          {team.players.length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic py-2">No players acquired</p>
                          ) : (
                            team.players.map(p => <RosterItem key={p.id} player={p} />)
                          )}
                      </div>
                  </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
