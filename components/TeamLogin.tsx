
import React, { useState, useEffect } from 'react';
import { Key, ArrowRight, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

interface TeamLoginProps {
  onLogin: (teamId: string) => void;
}

// Pre-defined 8-digit hashes for the 4 teams
export const TEAM_HASHES = [
  '38291047',
  '59102834',
  '72839105',
  '10293847'
];

export const TeamLogin = ({ onLogin }: TeamLoginProps) => {
  const { teams } = useAuction();
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear error when hash changes
  useEffect(() => {
    if (error) setError('');
  }, [hash]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHash = hash.trim();

    if (cleanHash.length !== 8) {
      setError('Hash must be exactly 8 digits.');
      return;
    }

    if (teams.length === 0) {
      setError('System is still loading team data. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);

    // Sort teams alphabetically to ensure the hash index always maps to the same team
    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    
    // Find which hash index was entered
    const hashIndex = TEAM_HASHES.indexOf(cleanHash);
    
    if (hashIndex !== -1) {
      const selectedTeam = sortedTeams[hashIndex];
      if (selectedTeam) {
        // Successful login
        setTimeout(() => {
          onLogin(selectedTeam.id);
          setIsSubmitting(false);
        }, 600);
      } else {
        // Hash valid but no team at that index (e.g. only 3 teams registered)
        setTimeout(() => {
          setError(`Hash accepted, but no team is assigned to slot ${hashIndex + 1}.`);
          setIsSubmitting(false);
        }, 600);
      }
    } else {
      // Invalid hash
      setTimeout(() => {
        setError('Invalid Access Hash. Please check with the Auctioneer.');
        setIsSubmitting(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-emerald-900/40 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <Key className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Team Portal</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Enter your 8-digit captain's access hash</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-rose-900/20 border border-rose-900/50 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Access Hash</label>
              <input
                type="text"
                maxLength={8}
                inputMode="numeric"
                value={hash}
                onChange={(e) => setHash(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-mono text-center text-2xl tracking-[0.2em] focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                placeholder="00000000"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || hash.length !== 8}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm"
            >
              {isSubmitting ? (
                <>Authenticating <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Access Portal <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
          
          <div className="mt-8 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ShieldCheck className="w-3 h-3" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Security Notice</p>
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed">Only one active session is allowed per team. Logging in will terminate other active sessions for this specific hash.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
