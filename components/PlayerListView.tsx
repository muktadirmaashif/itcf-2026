
import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { PlayerCategory, PlayerStatus, Player } from '../types';
import { formatCurrency, getPlayerImagePath } from '../utils/format';
import { User, Shield, Zap, Search } from 'lucide-react';

interface PlayerRowProps {
  player: Player;
  ownerName?: string;
}

// Fix: Explicitly type as React.FC to allow 'key' prop in map callbacks
const PlayerRow: React.FC<PlayerRowProps> = ({ player, ownerName }) => {
  const [error, setError] = useState(false);

  const getStatusColor = (status: PlayerStatus) => {
    switch (status) {
      case PlayerStatus.SOLD: return 'text-emerald-400 bg-emerald-400/10';
      case PlayerStatus.UNSOLD: return 'text-rose-400 bg-rose-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <tr className="hover:bg-slate-750/50 transition-colors">
      <td className="px-6 py-4 font-mono text-xs text-slate-500">{player.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 flex items-center justify-center">
            {!error ? (
              <img 
                src={getPlayerImagePath(player)} 
                alt=""
                className="w-full h-full object-cover"
                onError={() => setError(true)}
              />
            ) : (
              <User className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <span className="font-bold text-white">{player.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 rounded-full bg-slate-900 text-[10px] text-slate-400 uppercase font-medium border border-slate-700">
          {player.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(player.status)}`}>
          {player.status}
        </span>
      </td>
      <td className="px-6 py-4 font-medium text-slate-300">
        {ownerName || <span className="text-slate-600 italic">---</span>}
      </td>
      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
        {player.soldPrice ? formatCurrency(player.soldPrice) : <span className="text-slate-600">---</span>}
      </td>
    </tr>
  );
};

export const PlayerListView = () => {
  const { players, getTeamById } = useAuction();

  const categories = [PlayerCategory.A, PlayerCategory.B, PlayerCategory.C];

  const getCategoryIcon = (cat: PlayerCategory) => {
    switch (cat) {
      case PlayerCategory.A: return <Shield className="w-5 h-5 text-rose-500" />;
      case PlayerCategory.B: return <Zap className="w-5 h-5 text-amber-500" />;
      case PlayerCategory.C: return <User className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
             <Search className="w-8 h-8 text-emerald-500" /> Player Database
          </h2>
          <p className="text-slate-500 font-medium">Full list of all registered players and their auction status.</p>
        </div>
        <div className="flex gap-4">
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Total Players</span>
                <span className="text-xl font-black text-white">{players.length}</span>
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Sold</span>
                <span className="text-xl font-black text-emerald-500">{players.filter(p => p.status === PlayerStatus.SOLD).length}</span>
            </div>
        </div>
      </div>

      {categories.map(cat => {
        const catPlayers = players.filter(p => p.category === cat);
        return (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
              {getCategoryIcon(cat)}
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Category {cat}</h3>
              <span className="text-slate-500 text-sm ml-2">({catPlayers.length} players)</span>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Owner Team</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Sold Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {catPlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No players found in Category {cat}.</td>
                      </tr>
                    )}
                    {catPlayers.map(player => (
                      <PlayerRow 
                        key={player.id} 
                        player={player} 
                        ownerName={player.soldToTeamId ? getTeamById(player.soldToTeamId)?.name : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
