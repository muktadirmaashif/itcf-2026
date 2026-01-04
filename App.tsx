import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuctioneerPanel } from './components/AuctioneerPanel';
import { PlayerListView } from './components/PlayerListView';
import { Login } from './components/Login';
import { DataManagementModal } from './components/DataManagementModal';
import { Database } from 'lucide-react';

const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const auth = localStorage.getItem('it_auction_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('it_auction_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('it_auction_auth');
  };

  if (loading) return null;

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
                <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
                    <div className="mb-6 border-b border-slate-700 pb-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">Auctioneer Console</h2>
                        <p className="text-slate-500 text-sm">Manage bids, sold status, and auction phases.</p>
                      </div>
                      <button 
                        onClick={() => setIsDataModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-600 transition-colors flex items-center gap-2"
                      >
                        <Database className="w-4 h-4" /> Manage Data
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