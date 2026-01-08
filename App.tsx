
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuctioneerPanel } from './components/AuctioneerPanel';
import { PlayerListView } from './components/PlayerListView';
import { Login } from './components/Login';
import { DataManagementModal } from './components/DataManagementModal';
import { Database } from 'lucide-react';

/**
 * SECURE ACCESS CREDENTIALS
 * -------------------------
 * PUBLIC IDENTITY: auctioneer
 * PRIVATE ACCESS KEY: TPL-PRI-SECURE-9902-AUCTION-2026
 */

const SESSION_TOKEN_KEY = 'tpl_v3_session_secure_token';

// Immediately purge legacy insecure keys before the app even renders logic
if (typeof window !== 'undefined') {
  localStorage.removeItem('it_auction_auth');
}

const AppRoutes = () => {
  const { auctioneerPassword } = useAuction();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Session validation logic
    if (auctioneerPassword !== undefined) {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      // We only allow access if the stored token matches the 
      // private key fetched from the database context.
      if (storedToken && storedToken === auctioneerPassword) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (storedToken) localStorage.removeItem(SESSION_TOKEN_KEY);
      }
      setLoading(false);
    }
  }, [auctioneerPassword]);

  const handleLogin = (privateKey: string) => {
    // privateKey is the validated credential passed from Login component
    setIsAuthenticated(true);
    localStorage.setItem(SESSION_TOKEN_KEY, privateKey);
    navigate('/auctioneer');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">Establishing Secure Handshake...</p>
      </div>
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
              <Dashboard />
            </Layout>
          } 
        />

        <Route 
          path="/player-list" 
          element={
            <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
              <PlayerListView />
            </Layout>
          } 
        />
        
        <Route 
          path="/auctioneer" 
          element={
            isAuthenticated ? (
              <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6 shadow-inner">
                    <div className="mb-6 border-b border-slate-700 pb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Auctioneer Console</h2>
                        <p className="text-slate-500 text-sm font-medium">Official TPL Season 3 Live Control Panel</p>
                      </div>
                      <button 
                        onClick={() => setIsDataModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-600 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Database className="w-4 h-4" /> Management Tools
                      </button>
                    </div>
                    <AuctioneerPanel />
                </div>
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />
    </>
  );
};

export default function App() {
  return (
    <AuctionProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuctionProvider>
  );
}
