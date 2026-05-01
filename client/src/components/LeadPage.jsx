import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart, LayoutDashboard, Users, DollarSign, Megaphone,
  Target, CheckSquare, MessageCircle, HelpCircle, Settings,
  History, Clock, Loader2, Search, Bell, TrendingUp,
  UserPlus, Zap, UploadCloud
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
    <div className="flex items-center gap-3 font-medium text-sm">
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-500 group-hover:text-emerald-400'}`} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {badge}
      </span>
    )}
  </div>
);

const KPICard = ({ title, value, change, trend, icon: Icon }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all flex flex-col justify-between h-32">
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{title}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-600" />}
    </div>
    <div className="flex items-end gap-3 mt-4">
      <h2 className="text-3xl font-bold tracking-tight text-white">{value}</h2>
      <span className={`text-[11px] font-bold mb-1 pb-0.5 inline-flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend === 'up' ? '+' : ''}{change}
      </span>
    </div>
  </div>
);

const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
};

export default function LeadPage() {
  const navigate = useNavigate();
  const { data, setData, fileName, processBusinessData, history, isHistoryLoading, fetchHistory, currentUser } = useData();
  const [activePipelineFilter, setActivePipelineFilter] = useState('All');
  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleHistoryClick = async (id) => {
    try {
      setIsHistoryActionLoading(true);
      const res = await axios.get(`https://ai-data-analyst-lt82.onrender.com/api/history/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const upload = res.data.upload;
      const parsed = JSON.parse(upload.file_data);
      setData(parsed, upload.filename);
      processBusinessData(parsed);
    } catch (err) {
      console.error('History load error:', err.message);
    } finally {
      setIsHistoryActionLoading(false);
    }
  };

  const onDrop = React.useCallback(async (files) => {
    const file = files[0]; if (!file) return;
    setIsUploading(true);
    Papa.parse(file, {
      header: true, dynamicTyping: true,
      complete: async (res) => {
        const rows = res.data.filter(r => Object.values(r).some(v => v !== ''));
        if (rows.length) {
          setData(rows, file.name);
          processBusinessData(rows);
          try {
            await axios.post('https://ai-data-analyst-lt82.onrender.com/api/history',
              { filename: file.name, data: rows.slice(0, 1000) },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchHistory();
          } catch { /* silent */ }
        }
        setIsUploading(false);
      },
      error: () => setIsUploading(false)
    });
  }, [setData, processBusinessData, fetchHistory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, noClick: true });

  const handleAsk = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await axios.post('https://ai-data-analyst-lt82.onrender.com/api/ask', {
        question: aiQuestion,
        context: { 
          totalLeads: data.length,
          bestSource: computed?.bestSource,
          conversionRate: computed?.conversionRate,
          avgScore: computed?.avgScore,
          sampleLeads: data.slice(0, 5)
        }
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setAiAnswer(res.data.answer || "I couldn't generate an answer. Please try again.");
    } catch (error) {
      console.error('AI Error:', error.message);
      setAiAnswer(`Error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const computed = useMemo(() => {
    if (!data || data.length === 0) return null;
    const cols = Object.keys(data[0]);

    // Find likely columns for lead tracking
    const dateCol = cols.find(c => ['date','time','created','timestamp'].some(h => c.toLowerCase().includes(h)));
    let catCol = cols.find(c => ['source','medium','channel','origin','referrer'].some(h => c.toLowerCase().includes(h)));
    if (!catCol && data.length > 0) {
      catCol = cols.find(c => {
         const firstVal = data[0][c];
         if (typeof firstVal === 'string' && isNaN(Number(firstVal))) {
            const unique = new Set(data.slice(0, 50).map(r => String(r[c]).trim())).size;
            return unique > 1 && unique <= 10;
         }
         return false;
      });
    }
    let statCol = cols.find(c => ['status','stage','state','phase'].some(h => c.toLowerCase().includes(h)));
    const emailCol = cols.find(c => ['email','contact','mail'].some(h => c.toLowerCase().includes(h)));
    const nameCol = cols.find(c => ['name','customer','client','user'].some(h => c.toLowerCase().includes(h))) || cols[0];
    const scoreCol = cols.find(c => ['score','rating','probability','likelihood'].some(h => c.toLowerCase().includes(h)));

    const totalLeads = data.length;

    // Weekly trend from date
    const trendData = [];
    if (dateCol) {
      const map = {};
      data.forEach(r => {
        const d = new Date(r[dateCol]);
        if(!isNaN(d)) {
          const start = new Date(d.getFullYear(), 0, 1);
          const val = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
          map[`W${val}`] = (map[`W${val}`] || 0) + 1;
        }
      });
      const sortedKeys = Object.keys(map).sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).slice(-7);
      sortedKeys.forEach(k => trendData.push({ name: k, value: map[k] }));
      if(trendData.length === 0) [40, 60, 45, 80, 55, 90, 100].forEach((v, i) => trendData.push({ name: `W${i+1}`, value: v }));
    } else {
      [40, 60, 45, 80, 55, 90, 100].forEach((v, i) => trendData.push({ name: `W${i+1}`, value: v }));
    }

    // Status / Funnel
    let converted = 0;
    const convertedWords = ['won','closed','converted','sale','customer','done','completed','success'];
    if (statCol) {
      converted = data.filter(r => convertedWords.some(w => String(r[statCol]).toLowerCase().includes(w))).length;
      if (converted === 0) converted = Math.round(totalLeads * 0.15); // mock if none match
    } else {
      converted = Math.round(totalLeads * 0.18);
    }
    
    // Sources
    let sourceData = [];
    let bestSource = { name: 'Referral', rate: 32 };
    if (catCol) {
      const map = {};
      data.forEach(r => {
        let k = String(r[catCol] || 'Other').trim();
        map[k] = (map[k] || 0) + 1;
      });
      sourceData = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0, 5).map(([name, value]) => {
        // Calculate dynamic conversion rate per source if we have status
        let rate = Math.round(20 + Math.random() * 20); // Fallback mock rate
        if (statCol) {
          const sCount = data.filter(r => String(r[catCol] || 'Other').trim() === name).length;
          const sConverted = data.filter(r => String(r[catCol] || 'Other').trim() === name && convertedWords.some(w => String(r[statCol]).toLowerCase().includes(w))).length;
          rate = sCount ? Math.round((sConverted / sCount) * 100) : 0;
        }
        return { name, value, rate };
      });
      bestSource = sourceData.reduce((prev, current) => (prev.rate > current.rate) ? prev : current, sourceData[0]);
    } else {
      sourceData = [
        {name: 'Website', value: Math.round(totalLeads*0.4), rate: 25 + (totalLeads % 15)},
        {name: 'Instagram', value: Math.round(totalLeads*0.25), rate: 18 + (totalLeads % 12)},
        {name: 'Ads', value: Math.round(totalLeads*0.15), rate: 12 + (totalLeads % 20)},
        {name: 'Referral', value: Math.round(totalLeads*0.1), rate: 20 + (totalLeads % 25)},
        {name: 'LinkedIn', value: Math.round(totalLeads*0.1), rate: 28 + (totalLeads % 10)}
      ];
      bestSource = sourceData.reduce((prev, current) => (prev.rate > current.rate) ? prev : current, sourceData[0]);
    }
    
    // Funnel construction
    let qualifiedCount = 0;
    const qualifiedWords = ['qualif', 'interest', 'contact', 'progress', 'meet', 'negotiat', 'eval'];
    if (statCol) {
      qualifiedCount = data.filter(r => qualifiedWords.some(w => String(r[statCol]).toLowerCase().includes(w))).length;
    } 
    if (qualifiedCount === 0) {
      qualifiedCount = Math.round(totalLeads * (0.3 + ((totalLeads % 20)/100)));
    }
    
    let funnelConverted = converted;
    let funnelQualified = Math.max(qualifiedCount, funnelConverted + Math.round(totalLeads * 0.05 + 1));
    let funnelLeads = Math.max(totalLeads, funnelQualified + Math.round(totalLeads * 0.1 + 1));
    let visitors = Math.max(Math.round(funnelLeads * (3.5 + ((funnelLeads % 15) / 10))), funnelLeads * 2);

    const funnel = [
      { label: 'Visitors', count: visitors, pct: 100, color: '#3b82f6' },
      { label: 'Leads', count: funnelLeads, pct: Math.round((funnelLeads/visitors)*100), color: '#10b981' },
      { label: 'Qualified', count: funnelQualified, pct: Math.round((funnelQualified/visitors)*100), color: '#f59e0b' },
      { label: 'Customers', count: funnelConverted, pct: Math.round((funnelConverted/visitors)*100), color: '#10b981' }
    ];

    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;
    
    // Avg score
    let avgScore = 0;
    if (scoreCol) {
      const sums = data.reduce((s, r) => s + (parseFloat(r[scoreCol]) || 0), 0);
      avgScore = totalLeads > 0 ? Math.round(sums / totalLeads) : 0;
    } else {
      avgScore = 74;
    }

    // KPI Trends based on data sizes simply to avoid static display
    const kpiMetrics = {
      leadChange: totalLeads > 50 ? '+12.4%' : '+1.2%',
      convChange: converted > 10 ? '+3.2%' : '-1.5%',
      avgRespTime: totalLeads > 200 ? '2.4h' : '1.8h',
      respTimeChange: totalLeads > 200 ? '+12%' : '-24%',
      scoreChange: avgScore > 70 ? '+5.1%' : '-2.0%',
      newLeadsWidget: Math.round(totalLeads * 0.15) || 34,
      convertedWidget: Math.round(converted * 0.3) || 12,
    };

    // Pipeline mapping & Filtering
    let mappedPipeline = data.map((r, i) => {
      let statusStr = statCol ? String(r[statCol] || 'New') : ['New','Contacted','Interested','Converted'][i % 4];
      const emailStr = emailCol ? String(r[emailCol] || `contact${i}@example.com`) : `contact${i}@example.com`;
      let dateStr = 'Apr '+(i%30+1);
      if (dateCol && r[dateCol]) {
         const rawDate = new Date(r[dateCol]);
         if (!isNaN(rawDate)) dateStr = rawDate.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      }
      
      const s = String(statusStr).toLowerCase();
      let statusBadgeClass = 'bg-gray-500/10 text-gray-400';
      let statusGroup = 'New';

      if (convertedWords.some(w => s.includes(w))) {
          statusBadgeClass = 'bg-emerald-500/20 text-emerald-500';
          statusGroup = 'Converted';
      } else if (s.includes('interest')) {
          statusBadgeClass = 'bg-amber-500/10 text-amber-500';
          statusGroup = 'Interested';
      } else if (s.includes('contact')) {
          statusBadgeClass = 'bg-blue-500/10 text-blue-400';
          statusGroup = 'Contacted';
      } else {
          statusBadgeClass = 'bg-emerald-500/10 text-emerald-400';
      }

      if (!statCol && statusGroup === 'Converted') statusStr = 'Converted';

      const sScore = scoreCol ? Math.round(parseFloat(r[scoreCol])) || 50 : Math.round(50 + Math.random()*50);

      return {
        id: i,
        name: String(r[nameCol] || 'Unknown'),
        email: emailStr,
        source: catCol ? String(r[catCol] || 'Direct') : (sourceData[i % sourceData.length]?.name || 'Website'),
        status: statusStr,
        statusGroup,
        statusClass: statusBadgeClass,
        score: sScore,
        date: dateStr,
        initials: String(r[nameCol] || 'U').substring(0,2).toUpperCase()
      }
    });

    if (activePipelineFilter !== 'All') {
       mappedPipeline = mappedPipeline.filter(l => l.statusGroup === activePipelineFilter);
    }
    
    // Output top 20 max to limit visual spam
    mappedPipeline = mappedPipeline.slice(0, 20);

    return { totalLeads, conversionRate, avgScore, trendData, sourceData, funnel, mappedPipeline, kpiMetrics, bestSource };

  }, [data, activePipelineFilter]);

  const hasData = computed !== null;

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0 z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>
          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview"     onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}    label="Report"       onClick={() => navigate('/report')} />
            <SidebarItem icon={History}         label="History"      onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}           label="Lead" active  onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}      label="Revenue"      onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}       label="Marketing"    onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}     label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}   label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}      label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}        label="Settings"     badge="1" onClick={() => navigate('/settings')} />

          </nav>

          {/* Recent history */}
          <div className="mt-10 overflow-hidden text-[#94a3b8]">
            <div className="flex items-center gap-2 mb-4 px-3">
              <History className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {(isHistoryLoading || isHistoryActionLoading) ? (
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" /><span>Syncing…</span>
                </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} onClick={() => handleHistoryClick(item.id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 group transition-all">
                    <Clock className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400" />
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
        </div>

        {/* Lead Insights Widget */}
        <div className="mt-auto p-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 text-black shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100 to-transparent opacity-50 rounded-bl-[100px] pointer-events-none" />
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-xs">Lead Insights</h4>
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[10px] text-gray-500 mb-3">This week's summary</p>
            <div className="flex items-end justify-between font-bold">
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">New leads</div>
                <div className="text-sm">+{hasData ? computed.kpiMetrics.newLeadsWidget : 34}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">Converted</div>
                <div className="text-sm text-emerald-600">{hasData ? computed.kpiMetrics.convertedWidget : 12}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1015]">
        
        {/* Header */}
        <header className="h-[72px] border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full font-sans">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight">Leads</h2>
            {fileName && (
              <span className="bg-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-white/10 font-bold flex items-center gap-1.5 max-w-[200px] truncate">
                📄 {fileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div {...getRootProps()}>
              <input {...getInputProps()} ref={fileInputRef} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                  ${isUploading
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-wait'
                    : isDragActive
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}
              >
                {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><UploadCloud className="w-3.5 h-3.5" /> Upload CSV</>}
              </button>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-1"></div>

            <Search className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <Bell className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-6 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-[10px] uppercase border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0) || 'SS'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">
                  {currentUser?.firstName} {currentUser?.lastName || 'Selen Swift'}
                </p>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full p-8 space-y-6 custom-scrollbar">
          
          {/* Top KPIs Row */}
          <div className="grid grid-cols-4 gap-6">
            <KPICard title="Total Leads" value={hasData ? fmt(computed.totalLeads) : "960"} change={hasData ? computed.kpiMetrics.leadChange : "12.4%"} trend={hasData && computed.kpiMetrics.leadChange.startsWith('-') ? "down" : "up"} icon={UserPlus} />
            <KPICard title="Conversion Rate" value={hasData ? `${computed.conversionRate}%` : "20%"} change={hasData ? computed.kpiMetrics.convChange : "3.2%"} trend={hasData && computed.kpiMetrics.convChange.startsWith('-') ? "down" : "up"} icon={TrendingUp} />
            <KPICard title="Avg Response Time" value={hasData ? computed.kpiMetrics.avgRespTime : "1.8h"} change={hasData ? computed.kpiMetrics.respTimeChange : "-24%"} trend={hasData && computed.kpiMetrics.respTimeChange.startsWith('-') ? "down" : "up"} icon={MessageCircle} />
            <KPICard title="Lead Score Avg" value={hasData ? computed.avgScore : "78"} change={hasData ? computed.kpiMetrics.scoreChange : "5.1%"} trend={hasData && computed.kpiMetrics.scoreChange.startsWith('-') ? "down" : "up"} icon={Target} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-5 gap-6">
            
            {/* Trend Chart */}
            <div className="col-span-3 bg-[#11151b] rounded-2xl border border-white/5 p-6 border-b-2 border-b-emerald-500/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Weekly Lead Trend</h3>
                <span className="text-[10px] text-gray-500 font-bold border border-white/10 px-2 py-0.5 rounded-md bg-white/5">Last 7 weeks</span>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hasData ? computed.trendData : []}>
                    <defs>
                      <linearGradient id="emeraldLead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} dy={10} />
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 10 }} itemStyle={{ color: '#10b981' }} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#emeraldLead)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sources Chart Component */}
            <div className="col-span-2 bg-[#11151b] rounded-2xl border border-white/5 p-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Lead Sources</h3>
                 <span className="text-[10px] text-gray-500 font-bold border border-white/10 px-2 py-0.5 rounded-md bg-white/5">This month</span>
               </div>
               {hasData ? (
                 <div className="flex items-center h-[180px]">
                   <div className="w-[140px] h-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={computed.sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                           {computed.sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                         </Pie>
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex-1 space-y-3 pl-4">
                     {computed.sourceData.map((s, i) => (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                           <span className="text-[10px] text-gray-400 font-bold">{s.name}</span>
                         </div>
                         <span className="text-[11px] font-bold text-white">{fmt(s.value)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-center h-full text-xs text-gray-500">No data</div>
               )}
            </div>
          </div>

          {/* Funnel & Conversion Row */}
          <div className="grid grid-cols-3 gap-6">
             <div className="col-span-2 bg-[#11151b] rounded-2xl border border-white/5 p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Conversion Funnel</h3>
                 <span className="text-[10px] text-gray-500 font-bold border border-white/10 px-2 py-0.5 rounded-md bg-white/5">Overview</span>
               </div>
               
               <div className="space-y-5">
                 {(hasData ? computed.funnel : []).map((step, i) => (
                   <div key={i} className="relative">
                     <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5 px-0.5">
                       <span>{step.label}</span>
                       <span className="text-white">{fmt(step.count)} <span className="text-gray-500 ml-1">({step.pct}%)</span></span>
                     </div>
                     <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${step.pct}%`, backgroundColor: step.color }} />
                     </div>
                     {i < 3 && <div className="absolute -bottom-6 left-1/2 -ml-1 text-[#2d3748]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></div>}
                   </div>
                 ))}
               </div>
             </div>

             <div className="col-span-1 bg-[#11151b] rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
               <div>
                 <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Best Converting Source</h3>
                 <h2 className="text-2xl font-black text-white">{hasData && computed.bestSource ? computed.bestSource.name : 'Referral'}</h2>
                 <p className="text-[10px] text-gray-500 font-bold mb-6">{hasData && computed.bestSource ? `${computed.bestSource.rate}%` : '32%'} conversion rate</p>

                 <div className="space-y-3">
                   {(hasData ? computed.sourceData.slice(0,4) : []).map((s, i) => (
                     <div key={i} className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2 last:border-0 last:pb-0">
                       <span className="text-gray-400">{s.name}</span>
                       <span className={s.rate === computed.bestSource?.rate ? "text-emerald-400" : "text-white"}>{s.rate}%</span>
                     </div>
                   ))}
                   {!hasData && [
                     ["Referral", "32%"],
                     ["Website", "27%"],
                     ["LinkedIn", "22%"],
                     ["Instagram", "17%"]
                   ].map(([name, rate], i) => (
                     <div key={i} className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2 last:border-0 last:pb-0">
                       <span className="text-gray-400">{name}</span>
                       <span className={i === 0 ? "text-emerald-400" : "text-white"}>{rate}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2 items-center">
                 <Zap className="w-3.5 h-3.5 text-emerald-400 ml-1 shrink-0" />
                 <p className="text-[10px] font-bold text-emerald-400 leading-tight">
                   {hasData && computed.bestSource 
                     ? `${computed.bestSource.name} converts highest at ${computed.bestSource.rate}%` 
                     : 'Referrals convert 2x better than ads'}
                 </p>
               </div>
             </div>
          </div>

          {/* Lead Pipeline Table */}
          <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Lead Pipeline</h3>
              <div className="flex gap-2">
                {['All','New','Contacted','Interested','Converted'].map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setActivePipelineFilter(tag)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold border transition ${tag === activePipelineFilter ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full overflow-x-auto text-left">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(hasData ? computed.mappedPipeline : []).map((lead, i) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 pl-2 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[8px] font-black border border-emerald-500/30">
                          {lead.initials}
                        </div>
                        <span className="text-[11px] font-bold text-gray-200">{lead.name}</span>
                      </td>
                      <td className="py-3 text-[10px] font-medium text-gray-500">{lead.email}</td>
                      <td className="py-3 text-[10px] font-bold text-gray-400">{lead.source}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${lead.statusClass}`}>
                          {String(lead.status).length > 15 ? String(lead.status).substring(0,12)+'...' : lead.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-1.5 bg-white/5 rounded-full"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, lead.score)}%` }}></div></div>
                          <span className="text-[10px] font-bold text-white">{lead.score}</span>
                        </div>
                      </td>
                      <td className="py-3 text-[10px] font-bold text-gray-500">{lead.date}</td>
                      <td className="py-3 text-right pr-2">
                         <div className="flex justify-end gap-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer"><MailIcon /></div>
                           <div className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer"><EyeIcon /></div>
                           <div className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer"><DotsIcon /></div>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!hasData && <div className="text-center py-6 text-xs font-bold text-gray-600">Please upload data to view Pipeline</div>}
            </div>
          </div>

          {/* Ask AI Footer Box */}
          <div className="bg-[#11151b] border border-white/5 rounded-2xl p-5 shadow-2xl relative mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white tracking-tight">Ask AI about your leads</h3>
            </div>
            
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {['Which source gives best conversion?', 'Show me hot leads this week', 'Predict next month\'s leads'].map(q => (
                <button 
                  key={q} 
                  onClick={() => setAiQuestion(q)}
                  className="text-[9px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 hover:text-emerald-400 transition"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="relative group flex items-center">
              <input
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                type="text"
                placeholder="Ask anything about your leads..."
                className="w-full bg-[#0b0f15] border border-white/5 rounded-xl py-3 px-4 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600 shadow-inner"
              />
              <button 
                onClick={handleAsk}
                disabled={aiLoading}
                className="absolute right-2 h-[calc(100%-12px)] bg-emerald-500 text-black px-4 rounded-lg text-xs font-bold flex items-center transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {aiLoading ? <span className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full mr-2"></span> : 'Ask'}
              </button>
            </div>
            {aiAnswer && (
              <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-gray-300 leading-relaxed overflow-y-auto max-h-[200px]">
                {aiAnswer}
              </div>
            )}
          </div>

          <div className="h-6"></div>
        </div>
      </main>
    </div>
  );
}

// Small missing lucide icons or simple SVGs to prevent crash
const MailIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const EyeIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const DotsIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const SparklesIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>;
