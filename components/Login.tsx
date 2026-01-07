
import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'auctioneer' && password === 'tpl2026') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Auctioneer Access</h2>
            <p className="text-slate-400 text-sm mt-2">Please sign in to manage the auction</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-900/20 border border-rose-900 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/dashboard" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
