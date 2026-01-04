import React, { ReactNode } from 'react';
import { Trophy, Gavel, Users, List, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Layout = ({ children, isAuthenticated, onLogout }: LayoutProps) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none">
                Intra Therap <span className="text-emerald-500">Cricket Fiesta 2026</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Player Auction</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1 md:gap-4">
            <Link 
              to="/dashboard"
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-all text-sm font-medium ${isActive('/dashboard') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            
            <Link 
              to="/player-list"
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-all text-sm font-medium ${isActive('/player-list') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Player List</span>
            </Link>

            <Link 
              to="/auctioneer"
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-all text-sm font-medium ${isActive('/auctioneer') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Gavel className="w-4 h-4" />
              <span className="hidden md:inline">Auctioneer</span>
            </Link>

            {isAuthenticated && onLogout && (
               <button 
                  onClick={onLogout}
                  className="ml-2 flex items-center gap-2 px-3 py-2 rounded-md text-rose-400 hover:bg-rose-900/20 transition-all text-sm"
                  title="Logout"
               >
                  <LogOut className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {children}
      </main>
    </div>
  );
};