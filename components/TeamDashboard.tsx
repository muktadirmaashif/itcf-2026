
import React, { useState, useMemo } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCategory, PlayerStatus, AuctionPhase } from '../types';
import { User, CheckSquare, Square, Info, AlertTriangle, Search, Sparkles, Loader2, LogOut } from 'lucide-react';

export const TeamDashboard = ({ teamId, onLogout }: { teamId: string, onLogout: () => void }) => {
  const { players, teams, bidState, toggleInterest, phase } = useAuction();
  const [searchTerm, setSearchTerm] = useState('');
  const [isToggling, setIsToggling] = useState<string | null>(null);
  
  const team = teams.find(t => t.id === teamId);
  if (!team) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Team session expired. Please log in again.</div>;

  // Filter out SOLD and UNSOLD players from the Category C list for the team portal
  const catCPlayers = useMemo(() => players.filter(p => p.category === PlayerCategory.C && p.status === PlayerStatus.AVAILABLE), [players]);
  
  const teamInterests = useMemo(() => {
    return Object.keys(bidState.interests).filter(pid => bidState.interests[pid]?.includes(teamId));
  }, [bidState.interests, teamId]);

  // Lock interest selection ONLY if the auctioneer manually locked it
  const isInterestPhaseLocked = bidState.isInterestLocked;

  const filteredPlayers = useMemo(() => {
    return catCPlayers.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catCPlayers, searchTerm]);

  const handleToggle = async (playerId: string) => {
    if (isInterestPhaseLocked) return;
    
    const currentlyInterested = teamInterests.includes(playerId);
    if (!currentlyInterested && teamInterests.length >= 20) {
      alert("Maximum of 20 Category C players can be selected.");
      return;
    }
    
    setIsToggling(playerId);
    try {
      await toggleInterest(playerId, teamId);
    } catch (e) {
      console.error("Toggle interest failed", e);
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <User className="w-48 h-48 text-emerald-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">Team Captain Portal</p>
              <button 
                onClick={onLogout}
                className="md:hidden flex items-center gap-2 text-rose-400 bg-rose-400/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-400/20 transition-all"
              >
                <LogOut className="w-3 h-3" /> Log Out
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{team.name}</h2>
              <button 
                onClick={onLogout}
                className="hidden md:flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-400/20 transition-all border border-rose-400/20 ml-4 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" /> Terminate Session
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-6">
               <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Interest Used</p>
                 <p className={`text-xl font-black ${teamInterests.length >= 20 ? 'text-rose-500' : 'text-emerald-400'}`}>{teamInterests.length} / 20</p>
               </div>
               <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">System Status</p>
                 <div className="text-xl font-black uppercase tracking-tighter">
                   {isInterestPhaseLocked ? (
                     <span className="text-rose-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Closed</span>
                   ) : (
                     <span className="text-emerald-400 flex items-center gap-2"><Sparkles className="w-4 h-4 animate-pulse" /> Open</span>
                   )}
                 </div>
               </div>
            </div>
          </div>
          
          <div className="w-full md:w-72">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search Category C players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all text-white placeholder-slate-600 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {!isInterestPhaseLocked ? (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 leading-relaxed">
            Select up to <span className="font-bold">20 Category C players</span> you are interested in. If you are the only team interested in a player, you will acquire them at base price. Interest selection is currently controlled manually by the Auctioneer.
          </p>
        </div>
      ) : (
        <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">
            <span className="font-bold">Interest Selection is Closed.</span> The marker system has been locked by the Auctioneer. The list below shows your final interest markers.
          </p>
        </div>
      )}

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Player</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Interested?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlayers.map(player => {
                const isInterested = teamInterests.includes(player.id);
                const isSold = player.status === PlayerStatus.SOLD;
                const loading = isToggling === player.id;
                
                return (
                  <tr key={player.id} className={`transition-all duration-300 ${isInterested ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${isInterested ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                          {player.id.substring(1)}
                        </div>
                        <span className="font-bold text-white uppercase tracking-tight">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider bg-slate-900/50 px-2 py-1 rounded border border-white/5">{player.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {isSold ? (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 px-2 py-1 bg-slate-900 rounded border border-white/5">ALREADY SOLD</span>
                        ) : (
                          <button 
                            disabled={isInterestPhaseLocked || loading}
                            onClick={() => handleToggle(player.id)}
                            className={`p-2 rounded-xl transition-all duration-300 transform active:scale-90 ${
                              isInterested 
                              ? 'text-emerald-400 bg-emerald-500/20 shadow-inner' 
                              : isInterestPhaseLocked 
                                ? 'text-slate-700 opacity-50 cursor-not-allowed' 
                                : 'text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {loading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : isInterested ? (
                              <CheckSquare className="w-6 h-6" />
                            ) : (
                              <Square className="w-6 h-6" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Search className="w-10 h-10" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching players found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
