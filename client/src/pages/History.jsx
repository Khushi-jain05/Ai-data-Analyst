import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, FileBarChart, Users, DollarSign, Megaphone,
  CheckSquare, MessageCircle, HelpCircle, Settings,
  History as HistoryIcon, Clock, Loader2, Search, Bell,
  ChevronRight, FileText, RefreshCw, Database
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';

/* ── Sidebar item — identical to ReportPage ── */
const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
      ${active ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <div className="flex items-center gap-3 font-medium text-sm">
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-500 group-hover:text-emerald-400'}`} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
        ${active ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {badge}
      </span>
    )}
  </div>
);

export default function History() {
  const navigate  = useNavigate();
  const { history, isHistoryLoading, fetchHistory, setData, processBusinessData, currentUser } = useData();
  const [loadingId, setLoadingId] = useState(null);

  const loadDataset = async (item) => {
    try {
      setLoadingId(item.id);
      const res = await axios.get(`http://localhost:5002/api/history/${item.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const upload = res.data.upload;
      const parsed = JSON.parse(upload.file_data);
      setData(parsed, upload.filename);
      processBusinessData(parsed);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to load dataset:', err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden">

      {/* ═══ SIDEBAR — identical to ReportPage ═══ */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 flex flex-col h-full">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>

          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview"    onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}    label="Report"      onClick={() => navigate('/report')} />
            <SidebarItem icon={HistoryIcon}     label="History" active onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}           label="Lead" onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}      label="Revenue" onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}       label="Marketing" onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}     label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}   label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}      label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}        label="Settings"    badge="1" />
          </nav>

          {/* Recent Activity */}
          <div className="mt-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-3">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {isHistoryLoading ? (
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" /><span>Syncing…</span>
                </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => loadDataset(item)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 group transition-all"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-400 group-hover:text-white font-medium truncate">{item.filename}</span>
                      <span className="text-[9px] text-gray-600 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-600 italic">No recent uploads</p>
              )}
            </div>
          </div>

          {/* Bottom widgets group */}
          <div className="mt-auto space-y-3">
            {/* Report status */}
            <div
              className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 group cursor-pointer transition-all"
              onClick={() => navigate('/report')}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-bold text-white flex items-center justify-between">
                  Report status
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition" />
                </span>
                <span className="text-[9px] text-gray-500 truncate">
                  {history.length > 0 ? `${history.length} dataset${history.length > 1 ? 's' : ''} stored` : 'No data loaded'}
                </span>
              </div>
            </div>

            {/* Customer metric */}
            <div className="bg-[#161b22] p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Customer metric</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400">Lifetime value</p>
                  <p className="text-sm font-bold text-white">$92,500</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Net promoter</p>
                  <p className="text-sm font-bold text-emerald-400">Score 70</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Data History</h2>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              {history.length} Dataset{history.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchHistory}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Search className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" />
            <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" />
            <div className="flex items-center gap-3 ml-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-xs uppercase border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0b0f15]">

          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Database className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">No datasets yet</p>
                <p className="text-gray-500 text-sm">Upload a CSV on the Dashboard to start building your history</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-emerald-500 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 transition"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">
                All Uploads · {history.length} total
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-[#161b22] border border-white/5 rounded-[28px] p-6 group hover:border-emerald-500/30 hover:bg-[#161b22]/80 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => loadDataset(item)}
                  >
                    {/* Subtle gradient accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all" />

                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                        <FileText className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-bold text-white truncate mb-1 group-hover:text-emerald-400 transition-colors">
                        {item.filename}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                        {' · '}
                        {new Date(item.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        {loadingId === item.id ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                          </span>
                        ) : 'Click to load'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
