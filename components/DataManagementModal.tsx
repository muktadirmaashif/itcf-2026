import React, { useState, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';
import { parseStandardPlayerCSV, parseTeamsCSV } from '../utils/csvHelpers';
import { X, Upload, Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagementModal = ({ isOpen, onClose }: DataManagementModalProps) => {
  const { importPlayers, importTeams, resetAuction } = useAuction();
  const [activeTab, setActiveTab] = useState<'upload_players' | 'upload_teams' | 'reset'>('upload_players');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const playerFileInputRef = useRef<HTMLInputElement>(null);
  const teamFileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setTimeout(() => setNotification(null), 4000);
  };

  // --- ACTIONS ---

  const handlePlayerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          try {
            const importedPlayers = parseStandardPlayerCSV(text);
            if (importedPlayers.length > 0) {
              await importPlayers(importedPlayers);
              showNotification(`Imported ${importedPlayers.length} players successfully!`, 'success');
              if (playerFileInputRef.current) playerFileInputRef.current.value = '';
            } else {
              showNotification('No valid players found. Check CSV format (ID, Name, Category, Role)', 'error');
            }
          } catch (err: any) {
            showNotification(`Failed to import players: ${err.message}`, 'error');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTeamFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          try {
             const importedTeams = parseTeamsCSV(text);
             if (importedTeams.length > 0) {
                 await importTeams(importedTeams);
                 showNotification(`Imported ${importedTeams.length} teams successfully! Previous teams replaced.`, 'success');
                 if (teamFileInputRef.current) teamFileInputRef.current.value = '';
             } else {
                 showNotification('No valid teams found. Check CSV format (ID, Name)', 'error');
             }
          } catch (err: any) {
             showNotification(`Failed to import teams: ${err.message}`, 'error');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetState = async () => {
       if (confirm('This will RESET the auction progress. All players will become AVAILABLE and team budgets will be restored. No data will be deleted. Continue?')) {
           try {
               await resetAuction(true); // true = keep players/teams, just reset state
               showNotification('Auction state has been reset to default.', 'success');
           } catch(e: any) {
               showNotification(e.message || 'Reset failed.', 'error');
           }
       }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" /> Manage Data
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
            <button 
                onClick={() => setActiveTab('upload_players')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload_players' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
            >
                Upload Players
            </button>
            <button 
                onClick={() => setActiveTab('upload_teams')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload_teams' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
            >
                Upload Teams
            </button>
            <button 
                onClick={() => setActiveTab('reset')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'reset' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
            >
                Reset State
            </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {notification && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900' : 'bg-rose-900/20 text-rose-400 border border-rose-900'}`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {notification.msg}
                </div>
            )}

            {activeTab === 'upload_players' && (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-white mb-2">CSV Format Requirement</h3>
                        <p className="text-sm text-slate-400 mb-2">
                            Upload a CSV file with the following columns (headers optional):
                        </p>
                        <div className="bg-slate-950 p-3 rounded font-mono text-xs text-slate-300 overflow-x-auto">
                            | ID  | Name           | Category | Role      |<br/>
                            | A01 | Tahsin         | A        | Bowler    |<br/>
                            | B05 | Player Name    | B        | Batsman   |
                        </div>
                    </div>
                    
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => playerFileInputRef.current?.click()}>
                        <Upload className="w-12 h-12 text-slate-500 mb-4" />
                        <span className="text-slate-300 font-medium">Click to upload Players CSV</span>
                        <input 
                            type="file" 
                            accept=".csv"
                            ref={playerFileInputRef}
                            className="hidden"
                            onChange={handlePlayerFileUpload}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'upload_teams' && (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-white mb-2">CSV Format Requirement</h3>
                        <p className="text-sm text-slate-400 mb-2">
                            Upload a CSV file with the following columns (headers optional):
                        </p>
                        <div className="bg-slate-950 p-3 rounded font-mono text-xs text-slate-300 overflow-x-auto">
                            | ID  | Name           |<br/>
                            | T01 | Debug Devils   |<br/>
                            | T02 | Code Crushers  |
                        </div>
                        <p className="text-xs text-rose-400 mt-2 font-semibold">
                            Note: Uploading teams will remove existing teams and unassign any sold players.
                        </p>
                    </div>
                    
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => teamFileInputRef.current?.click()}>
                        <Upload className="w-12 h-12 text-slate-500 mb-4" />
                        <span className="text-slate-300 font-medium">Click to upload Teams CSV</span>
                        <input 
                            type="file" 
                            accept=".csv"
                            ref={teamFileInputRef}
                            className="hidden"
                            onChange={handleTeamFileUpload}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'reset' && (
                <div className="space-y-6">
                    <div className="bg-amber-900/10 border border-amber-900/50 p-4 rounded-lg">
                        <h3 className="font-bold text-amber-500 mb-2">Reset Auction State</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Restore the auction to the beginning. 
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>All players marked as AVAILABLE (Unsold).</li>
                                <li>All team budgets restored to full amount.</li>
                                <li>Auction phase reset to Setup.</li>
                                <li>No teams or players are deleted.</li>
                            </ul>
                        </p>
                        <button 
                            onClick={handleResetState}
                            className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Reset Auction State
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};