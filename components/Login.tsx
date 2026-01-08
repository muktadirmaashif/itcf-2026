
import React, { useState } from 'react';
import { KeyRound, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

interface LoginProps {
  onLogin: (privateKey: string) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const { auctioneerPassword } = useAuction();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const secret = auctioneerPassword || 'TPL-PRI-SECURE-9902-AUCTION-2026';
    
    // Strict credential matching
    if (username === 'auctioneer' && password === secret) {
      onLogin(password);
    } else {
      setError('Invalid Identity or Private Access Key');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[100px]"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-emerald-950/40 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <KeyRound className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Access</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium tracking-wide">Secure Private Handshake Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-rose-950/30 border border-rose-500/30 text-rose-400 px-4 py-4 rounded-2xl text-xs flex items-center gap-3 animate-in shake-in">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <p className="font-bold leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all shadow-inner placeholder:text-slate-700"
                placeholder="auctioneer"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Private Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-inner placeholder:text-slate-700"
                placeholder="••••••••••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs"
            >
              Authorize Session <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 text-center relative z-10 border-t border-slate-700/50 pt-6">
            <Link to="/dashboard" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">
              &larr; Exit to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
