
import React, { useState, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';
import { parseStandardPlayerCSV, parseTeamsCSV } from '../utils/csvHelpers';
import { X, Upload, Database, RefreshCw, CheckCircle, AlertCircle, Stars } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OFFICIAL_PLAYER_CSV = `id,name,category,role
A01,Mezanul Hoque Chy,A,Bowler
A02,M Rashidur Rahman Rafi,A,All Rounder
A03,Md Muktadir Maula,A,All Rounder
A04,Kazi Moin,A,Openning Batter
A05,Monir Hossain,A,All Rounder
B01,Mohammed Ashfaq Raiyan,B,Middle Order Batter
B02,Ishraq Ahmed Esha,B,Middle Order Batter
B03,Hasibul Islam,B,All Rounder
B04,Rubel Alfaz,B,All Rounder
B05,Abdullah Umar Nasib,B,Wicket-Keeper
B06,Sayed Ahmed Tasin,B,All Rounder
B07,Mohammad Abdur Rafi Farhab,B,Middle Order Batter
B08,Abid Mahadi,B,Openning Batter
B09,Sheikh Ahaduzzaman,B,Bowler
B10,Tanvir Chowdhury,B,All Rounder
C01,Prattay Iqbal,C,Wicket-Keeper
C02,Ariful Islam,C,Bowler
C03,Al Mohammad Aladin,C,Openning Batter
C04,Mirza Mehedi Iqbal,C,Bowler
C05,Syed Ishmum Ahnaf,C,Bowler
C06,Nabil Hossain,C,Middle Order Batter
C07,Raihan Mastafa Khiljee,C,Bowler
C08,Md. Yeasin Gazi,C,Openning Batter
C09,Md. Kaium,C,Middle Order Batter
C10,Md. Ali,C,Bowler
C11,Rupam Shangma,C,All Rounder
C12,Joyel,C,Middle Order Batter
C13,Anindro Kumar Roy (Joy),C,All Rounder
C14,Sahab-Al-Chowdhury,C,Middle Order Batter
C15,Zahidul Islam,C,All Rounder
C16,Mukhlesur Rahman,C,Middle Order Batter
C17,Sameer Shafayet Latif,C,Openning Batter
C18,Saifullah Khalid Jubaer,C,All Rounder
C19,Md Shajjad Howlader,C,Openning Batter
C20,Md. Rafin Jawad Hafiz,C,Openning Batter
C21,Kashshaf Mahbub Sakif,C,All Rounder
C22,Niloy Roy,C,Middle Order Batter
C23,Faysal Moin Ahsan,C,All Rounder
C24,Abeer Mahmood Kalam,C,Openning Batter
C25,Redwan Rifat Fahim,C,Openning Batter
C26,Tabiul Hasan,C,Middle Order Batter
C27,Mohammad Masuk Imtiaz,C,Middle Order Batter
C28,Hasin Ibtida,C,Bowler
C29,Joy Sarker,C,Bowler
C30,Apurbo Banik Turjo,C,All Rounder
C31,Mostofa Washif,C,All Rounder
C32,Iftekhar Ahmed Ifty,C,Middle Order Batter
C33,Imran Hossain,C,Openning Batter
C34,Subrata Nath,C,Bowler
C35,Fahim Mushfiq,C,Middle Order Batter
C36,Sakif Yeaser,C,Middle Order Batter
C37,Ove Bepari,C,Middle Order Batter
C38,Sunjare Zulfiker,C,Middle Order Batter
C39,Tawratur Rashid,C,Openning Batter
C40,Shoeb Akibul Islam,C,Wicket-Keeper
C41,Partha Sarothi Bhowmik,C,Openning Batter
C42,MD Tuhin Ahmed,C,Middle Order Batter
C43,Manzil hasan,C,Bowler
C44,Nasim Ahmed,C,All Rounder
C45,Tanzim,C,Bowler
C46,Moontasir Mamun,C,Middle Order Batter
C47,Md Sifat Hossain,C,Bowler`;

export const DataManagementModal = ({ isOpen, onClose }: DataManagementModalProps) => {
  const { importPlayers, importTeams, resetAuction } = useAuction();
  const [activeTab, setActiveTab] = useState<'upload_players' | 'upload_teams' | 'reset'>('upload_players');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const playerFileInputRef = useRef<HTMLInputElement>(null);
  const teamFileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSeedOfficialPlayers = async () => {
    if (confirm('Overwrite with official players?')) {
      setIsSeeding(true);
      try {
        const importedPlayers = parseStandardPlayerCSV(OFFICIAL_PLAYER_CSV);
        await importPlayers(importedPlayers);
        showNotification(`Successfully seeded ${importedPlayers.length} players!`, 'success');
      } catch (err: any) {
        showNotification(`Failed: ${err.message}`, 'error');
      } finally { setIsSeeding(false); }
    }
  };

  const handlePlayerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          try {
            const importedPlayers = parseStandardPlayerCSV(text);
            await importPlayers(importedPlayers);
            showNotification(`Imported ${importedPlayers.length} players!`, 'success');
          } catch (err: any) { showNotification(err.message, 'error'); }
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
             await importTeams(importedTeams);
             showNotification(`Imported ${importedTeams.length} teams!`, 'success');
          } catch (err: any) { showNotification(err.message, 'error'); }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetState = async () => {
       if (confirm('Reset auction floor?')) {
           try {
               await resetAuction(true); 
               showNotification('Auction reset.', 'success');
           } catch(e: any) { showNotification(e.message, 'error'); }
       }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" /> Manage Data
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('upload_players')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upload_players' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900/50 text-slate-400'}`}>Players</button>
            <button onClick={() => setActiveTab('upload_teams')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upload_teams' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900/50 text-slate-400'}`}>Teams</button>
            <button onClick={() => setActiveTab('reset')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'reset' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'bg-slate-900/50 text-slate-400'}`}>Reset</button>
        </div>

        <div ref={contentRef} className="p-6 overflow-y-auto flex-1">
            {notification && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900' : 'bg-rose-900/20 text-rose-400 border border-rose-900'}`}>
                    <CheckCircle className="w-5 h-5" /> {notification.msg}
                </div>
            )}
            {activeTab === 'upload_players' && (
                <div className="space-y-6">
                    <button onClick={handleSeedOfficialPlayers} disabled={isSeeding} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-black text-sm flex items-center justify-center gap-3">
                        {isSeeding ? <RefreshCw className="animate-spin" /> : <Stars />} SEED OFFICIAL LIST
                    </button>
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center" onClick={() => playerFileInputRef.current?.click()}>
                        <Upload className="w-12 h-12 text-slate-500 mb-4" />
                        <span className="text-slate-300">Click to upload Players CSV</span>
                        <input type="file" accept=".csv" ref={playerFileInputRef} className="hidden" onChange={handlePlayerFileUpload} />
                    </div>
                </div>
            )}
            {activeTab === 'upload_teams' && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center" onClick={() => teamFileInputRef.current?.click()}>
                        <Upload className="w-12 h-12 text-slate-500 mb-4" />
                        <span className="text-slate-300">Click to upload Teams CSV</span>
                        <input type="file" accept=".csv" ref={teamFileInputRef} className="hidden" onChange={handleTeamFileUpload} />
                    </div>
                </div>
            )}
            {activeTab === 'reset' && (
                <button onClick={handleResetState} className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 rounded-lg font-black text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> RESET AUCTION FLOOR
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
