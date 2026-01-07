
import React, { ReactNode } from 'react';
import { Trophy, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout = ({ 
  children, 
  isAuthenticated, 
  onLogout 
}: { 
  children?: ReactNode, 
  isAuthenticated?: boolean, 
  onLogout?: () => void 
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col w-full">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 w-full px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg"><Trophy className="w-6 h-6 text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-white leading-none uppercase tracking-tighter">THERAP PREMIER LEAGUE</h1>
              <p className="text-emerald-500 font-black text-[10px] tracking-widest">SEASON 3 2026</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto custom-scrollbar">
            <Link to="/dashboard" className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isActive('/dashboard') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>Dashboard</Link>
            <Link to="/player-list" className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isActive('/player-list') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>Players</Link>
            <Link to="/auctioneer" className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isActive('/auctioneer') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>Auctioneer</Link>
            {isAuthenticated && <button onClick={onLogout} className="p-2 text-rose-400 hover:bg-rose-900/20 rounded-md ml-2"><LogOut className="w-5 h-5" /></button>}
          </div>
      </header>
      <main className="flex-1 w-full px-6 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
