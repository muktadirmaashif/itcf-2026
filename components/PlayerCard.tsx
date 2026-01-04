import React from 'react';
import { Player, PlayerCategory } from '../types';
import { User, Shield, Activity, Target } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface PlayerCardProps {
  player: Player;
  isSpotlight?: boolean;
}

export const PlayerCard = ({ player, isSpotlight = false }: PlayerCardProps) => {
  const getCategoryColor = (cat: PlayerCategory) => {
    switch (cat) {
      case PlayerCategory.A: return 'bg-rose-600';
      case PlayerCategory.B: return 'bg-amber-600';
      case PlayerCategory.C: return 'bg-emerald-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-800 border ${isSpotlight ? 'border-emerald-500 shadow-2xl shadow-emerald-900/50' : 'border-slate-700'}`}>
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold text-white ${getCategoryColor(player.category)}`}>
        CATEGORY {player.category}
      </div>
      
      <div className="p-6 flex flex-col items-center text-center">
        <div className={`mb-4 rounded-full flex items-center justify-center bg-slate-700 ${isSpotlight ? 'w-32 h-32' : 'w-20 h-20'}`}>
           <User className={`${isSpotlight ? 'w-16 h-16' : 'w-10 h-10'} text-slate-400`} />
        </div>
        
        <h3 className={`${isSpotlight ? 'text-3xl' : 'text-xl'} font-bold text-white mb-2`}>{player.name}</h3>
        
        <div className="flex items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-300 font-medium uppercase tracking-wide">
            {player.role}
          </span>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Base Price</p>
            <p className="font-mono font-bold text-emerald-400">
              {formatCurrency(player.basePrice)}
            </p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
             <p className="text-xs text-slate-400 mb-1">Status</p>
             <p className={`font-bold ${player.status === 'SOLD' ? 'text-rose-400' : 'text-slate-200'}`}>
               {player.status}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
