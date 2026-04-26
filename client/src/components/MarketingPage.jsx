import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart, LayoutDashboard, Users, DollarSign, Megaphone,
  Target, CheckSquare, MessageCircle, HelpCircle, Settings,
  History, Clock, Loader2, Search, Bell, TrendingUp, TrendingDown,
  UploadCloud, Zap, Sparkles, Globe,
  TrendingUp as TrendUpIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Line, ComposedChart, Cell, PieChart, Pie, Legend
} from 'recharts';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

/* ── helpers ── */
const fmtK = (n) => {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}L`; 
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(0)}k`;
  return `₹${Math.round(n)}`;
};

const truncate = (str, len = 15) => {
  if (!str) return '';
  const s = String(str);
  return s.length > len ? s.substring(0, len) + "..." : s;
};

/* ── sidebar shared component ── */
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

const MarketingCard = ({ title, value, change, sub, icon: Icon, color = 'emerald' }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all flex flex-col justify-between h-36">
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{title}</span>
      <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
        {Icon && <Icon className={`w-4 h-4 text-${color}-400`} />}
      </div>
    </div>
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-white mt-2">{value}</h2>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
        <span className="text-[10px] text-gray-500">{sub}</span>
      </div>
    </div>
  </div>
);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MarketingPage() {
  const navigate = useNavigate();
  const { data, setData, fileName, processBusinessData, history, isHistoryLoading, fetchHistory, currentUser } = useData();
  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [trendTab, setTrendTab] = useState('Traffic');
  const fileInputRef = useRef(null);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleHistoryClick = async (id) => {
    try {
      setIsHistoryActionLoading(true);
      const res = await axios.get(`http://localhost:5002/api/history/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const upload = res.data.upload;
      const parsed = JSON.parse(upload.file_data);
      setData(parsed, upload.filename);
      processBusinessData(parsed);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsHistoryActionLoading(false);
    }
  };

  const onDrop = useCallback(async (files) => {
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
            await axios.post('http://localhost:5002/api/history',
              { filename: file.name, data: rows.slice(0, 1000) },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchHistory();
          } catch { /* silent */ }
        }
        setIsUploading(false);
      },
      error: () => setIsUploading(false),
    });
  }, [setData, processBusinessData, fetchHistory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, noClick: true });

  /* ── marketing metrics ── */
  const mkt = useMemo(() => {
    const hasData = data && data.length > 0;
    
    // Default demo data if no data
    let finalChannels = [
      { name: 'Google Ads', visitors: 12400, leads: 620, customers: 186, revenue: 558000, spend: 120000, color: '#10b981' },
      { name: 'Instagram',  visitors: 18200, leads: 546, customers: 82,  revenue: 246000, spend: 95000,  color: '#3b82f6' },
      { name: 'Facebook',   visitors: 9800,  leads: 392, customers: 118, revenue: 354000, spend: 88000,  color: '#ef4444' },
      { name: 'Direct',     visitors: 6500,  leads: 260, customers: 130, revenue: 390000, spend: 0,      color: '#f59e0b' },
      { name: 'Email',      visitors: 4200,  leads: 336, customers: 168, revenue: 504000, spend: 15000,  color: '#8b5cf6' },
    ];

    if (hasData) {
      const cols = Object.keys(data[0]);
      
      // Smarter categorical detector: find a column with string values that are relatively short
      const categoricalHuristic = cols.find(c => {
         const sample = data.slice(0, 10).map(r => String(r[c] || ''));
         const avgLen = sample.reduce((s, v) => s + v.length, 0) / (sample.length || 1);
         const unique = new Set(sample).size;
         return typeof data[0][c] === 'string' && avgLen < 30 && unique > 1 && unique < 50;
      });

      const channelCol = cols.find(c => ['channel', 'source', 'platform', 'campaign', 'medium', 'category', 'type', 'segment', 'origin'].some(h => c.toLowerCase().includes(h))) 
        || categoricalHuristic
        || cols.find(c => typeof data[0][c] === 'string' && String(data[0][c]).length < 50)
        || cols[0];

      const revenueCol = cols.find(c => ['revenue', 'sales', 'amount', 'total', 'profit', 'price'].some(h => c.toLowerCase().includes(h)));
      const leadCol    = cols.find(c => ['lead', 'contact', 'status', 'type', 'stage', 'phase'].some(h => c.toLowerCase().includes(h)));
      const spendCol   = cols.find(c => ['spend', 'cost', 'budget', 'ad', 'expense'].some(h => c.toLowerCase().includes(h)));
      const visitorsCol = cols.find(c => ['visitor', 'session', 'traffic', 'user', 'view', 'click', 'hit'].some(h => c.toLowerCase().includes(h)));

      if (channelCol) {
        const stats = {};
        data.forEach(row => {
          const rawCh = row[channelCol] || 'Unknown';
          const ch = truncate(rawCh, 25); 
          if (!stats[ch]) stats[ch] = { name: ch, visitors: 0, leads: 0, customers: 0, revenue: 0, spend: 0 };
          
          if (visitorsCol) stats[ch].visitors += Number(row[visitorsCol]) || 0;
          else stats[ch].visitors += Math.floor(Math.random() * 50) + 10; // Mock visitors if missing

          if (revenueCol) stats[ch].revenue += Number(row[revenueCol]) || 0;
          if (spendCol) stats[ch].spend += Number(row[spendCol]) || 0;
          
          if (leadCol) {
             const val = String(row[leadCol]).toLowerCase();
             if (val.includes('lead') || val.includes('contact') || val.includes('interested') || val.includes('prospect')) stats[ch].leads += 1;
             else if (val.includes('customer') || val.includes('won') || val.includes('closed') || val.includes('sale')) {
               stats[ch].leads += 1;
               stats[ch].customers += 1;
             }
          } else {
             // Heuristic: assume 10% of rows are leads if no lead col
             if (Math.random() > 0.9) stats[ch].leads += 1;
             if (Math.random() > 0.95) stats[ch].customers += 1;
          }
        });
        
        finalChannels = Object.values(stats)
          .sort((a,b) => b.revenue - a.revenue)
          .slice(0, 6)
          .map(c => ({
            ...c,
            visitors: c.visitors || Math.floor(Math.random() * 1000) + 500,
            leads: c.leads || Math.floor(c.visitors * 0.1),
            customers: c.customers || Math.floor(c.leads * 0.3)
          }));

        const palette = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
        finalChannels.forEach((c, i) => c.color = palette[i % palette.length]);
      }
    }

    const totalVisitors = finalChannels.reduce((sum, c) => sum + (Number(c.visitors) || 0), 0);
    const totalLeads = finalChannels.reduce((sum, c) => sum + (Number(c.leads) || 0), 0);
    const totalRevenue = finalChannels.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    const totalCustomers = finalChannels.reduce((sum, c) => sum + (Number(c.customers) || 0), 0);
    const convRate = totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(1) : 0;

    const bestChannel = finalChannels[0] || { name: 'N/A', revenue: 0 };
    const needsImprovement = [...finalChannels].sort((a,b) => (a.customers/(a.visitors||1)) - (b.customers/(b.visitors||1)))[0] || { name: 'N/A', visitors: 1, customers: 0 };

    // Trends logic - redistribute totals across months
    const trendData = MONTHS.map((m, i) => {
       const weight = (Math.sin(i * 0.5) + 2) / 3; 
       return {
         month: m,
         visitors: Math.round((totalVisitors / 12) * weight),
         leads: Math.round((totalLeads / 12) * weight),
         customers: Math.round((totalCustomers / 12) * weight)
       };
    });

    const safeConv = needsImprovement ? ((needsImprovement.customers / (needsImprovement.visitors || 1)) * 100).toFixed(1) : '0';

    return {
      channels: finalChannels,
      trendData,
      totalVisitors,
      totalLeads,
      totalCustomers,
      convRate,
      totalRevenue,
      insight: hasData && bestChannel.name !== 'N/A'
        ? `${bestChannel.name} is your top performing channel with ${fmtK(bestChannel.revenue)} in revenue. ${needsImprovement.name} has the lowest conversion efficiency at ${safeConv}%.`
        : `Google Ads generated the highest revenue at ₹558k with a 1.5% conversion rate. Instagram brings high traffic but has the lowest conversion rate.`,
      bestChannel,
      needsImprovement
    };
  }, [data]);

  const { channels, trendData, totalVisitors, totalLeads, totalCustomers, convRate, totalRevenue, insight, bestChannel, needsImprovement } = mkt;

  const tooltipStyle = { backgroundColor:'#161b22', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:10 };

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex-col hidden lg:flex shrink-0 z-20 h-full overflow-hidden">
        <div className="px-8 pt-8 pb-2 shrink-0">
          <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>
          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview"      onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}    label="Report"        onClick={() => navigate('/report')} />
            <SidebarItem icon={History}         label="History"       onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}           label="Lead"          onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}      label="Revenue"       onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}       label="Marketing" active />
            <SidebarItem icon={CheckSquare}     label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}   label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}      label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}        label="Settings" badge="1" onClick={() => navigate('/settings')} />

          </nav>
        </div>

        {/* Recent Activity */}
        <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0 custom-scrollbar">
          <div className="flex items-center gap-2 mb-3 px-3">
            <History className="w-4 h-4 text-gray-500" />
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
          </div>
          <div className="space-y-1">
            {(isHistoryLoading || isHistoryActionLoading) ? (
              <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                <Loader2 className="w-3 h-3 animate-spin" /><span>Syncing…</span>
              </div>
            ) : history.length > 0 ? (
              history.map(item => (
                <div key={item.id} onClick={() => handleHistoryClick(item.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 group transition-all">
                  <Clock className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 shrink-0" />
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
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1015]">
        
        {/* Header */}
        <header className="h-[72px] border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full font-sans">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-black tracking-tight">Marketing Analytics</h2>
               {fileName && (
                 <span className="bg-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-white/10 font-bold flex items-center gap-1.5 max-w-[200px] truncate">
                   📄 {fileName}
                 </span>
               )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Campaign performance, leads &amp; channel insights</p>
          </div>

          <div className="flex items-center gap-5">
            {/* ── CSV upload button ── */}
            <div {...getRootProps()} className="relative font-sans">
              <input {...getInputProps()} ref={fileInputRef} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all
                  ${ isUploading
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-wait'
                      : isDragActive
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5'
                  }`}
              >
                {isUploading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                  : <><UploadCloud className="w-3.5 h-3.5" /> Upload CSV</>}
              </button>
            </div>

            <Search className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <Bell   className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            
            <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-6 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-[10px] uppercase border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0) || 'DN'}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'DataNova User'}
                </p>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          {/* AI Banner */}
          <div className="bg-[#161b22] border-l-4 border-emerald-500 rounded-r-2xl rounded-l-md p-5 flex items-start gap-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
               <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wider">AI Marketing Analysis</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                {insight}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5">
            <MarketingCard title="Total Visitors" value={totalVisitors.toLocaleString()} change="+12.5%" sub="total traffic" icon={Globe} color="emerald" />
            <MarketingCard title="Total Leads"    value={totalLeads.toLocaleString()}    change="+8.2%"  sub="generated leads" icon={Target} color="emerald" />
            <MarketingCard title="Conversion Rate" value={`${convRate}%`}               change="+1.3%"  sub="visitors to customers" icon={TrendUpIcon} color="emerald" />
            <MarketingCard title="Total Revenue"  value={fmtK(totalRevenue)}             change="+18.7%" sub="from marketing" icon={DollarSign} color="emerald" />
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* Traffic & Lead Trend */}
            <div className="col-span-3 bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-white">Traffic &amp; Lead Trend</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Visitors vs Leads vs Customers</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                  <button onClick={() => setTrendTab('Traffic')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${trendTab === 'Traffic' ? 'bg-emerald-500 text-black' : 'text-gray-500'}`}>Traffic</button>
                  <button onClick={() => setTrendTab('Leads')}   className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${trendTab === 'Leads' ? 'bg-emerald-500 text-black' : 'text-gray-500'}`}>Leads</button>
                </div>
              </div>
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar 
                      dataKey={trendTab === 'Traffic' ? 'visitors' : 'leads'} 
                      fill={trendTab === 'Traffic' ? '#10b981' : '#3b82f6'} 
                      radius={[4,4,0,0]} 
                      barSize={20} 
                      opacity={0.8} 
                      name={trendTab}
                    />
                    <Line type="monotone" dataKey="customers" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Customers" />
                    <Legend content={() => (
                      <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold text-gray-400">
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-sm ${trendTab === 'Traffic' ? 'bg-emerald-500' : 'bg-gray-500/20 border border-white/10'}`} /> 
                           Visitors
                         </div>
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-sm ${trendTab === 'Leads' ? 'bg-blue-500' : 'bg-gray-500/20 border border-white/10'}`} /> 
                           Leads
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-amber-500 rounded-full" /> 
                           Customers
                         </div>
                      </div>
                    )} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue vs Ad Spend */}
            <div className="col-span-2 bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-black text-white">Revenue vs Ad Spend</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 mb-6">By marketing channel (₹k)</p>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channels} layout="horizontal" margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} barSize={24} name="Revenue" />
                    <Bar dataKey="spend"   fill="#ef4444" radius={[4,4,0,0]} barSize={24} name="Ad Spend" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Leads by Channel */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-black text-white mb-6">Leads by Channel</h3>
              <div className="flex items-center justify-around h-[240px]">
                <div className="h-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channels}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="leads"
                      >
                        {channels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 pr-10">
                   {channels.map(c => (
                     <div key={c.name} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-[10px] font-bold text-gray-400 w-20">{c.name}</span>
                        <span className="text-[10px] font-black text-white">{c.leads}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Marketing Funnel */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-black text-white mb-6">Marketing Funnel</h3>
              <div className="space-y-8">
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Visitors</span>
                     <span className="text-[11px] font-black text-white">{totalVisitors.toLocaleString()} (100.0%)</span>
                   </div>
                   <div className="w-full h-8 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div className="h-full bg-emerald-500 opacity-80" style={{ width: '100%' }} />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black">100%</div>
                   </div>
                   <div className="flex justify-center mt-1 text-[10px] text-gray-600 font-bold">↓ {totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(1) : 0}% converted</div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Leads</span>
                     <span className="text-[11px] font-black text-white">{totalLeads.toLocaleString()} ({totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(1) : 0}%)</span>
                   </div>
                   <div className="w-full h-8 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div className="h-full bg-emerald-500 opacity-60" style={{ width: `${totalVisitors > 0 ? (totalLeads / totalVisitors * 100) : 0}%`, minWidth: '10%' }} />
                      <div className="absolute left-4 inset-0 flex items-center text-[10px] font-black text-black">{totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(1) : 0}%</div>
                   </div>
                   <div className="flex justify-center mt-1 text-[10px] text-gray-600 font-bold">↓ {totalLeads > 0 ? ((totalCustomers / totalLeads) * 100).toFixed(1) : 0}% converted</div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customers</span>
                     <span className="text-[11px] font-black text-white">{totalCustomers.toLocaleString()} ({totalVisitors > 0 ? ((totalCustomers / totalVisitors) * 100).toFixed(1) : 0}%)</span>
                   </div>
                   <div className="w-full h-8 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div className="h-full bg-emerald-500 opacity-30" style={{ width: `${totalVisitors > 0 ? (totalCustomers / totalVisitors * 100) : 0}%`, minWidth: '5%' }} />
                      <div className="absolute left-4 inset-0 flex items-center text-[10px] font-black text-white">{totalVisitors > 0 ? ((totalCustomers / totalVisitors) * 100).toFixed(1) : 0}%</div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             {/* Best Performing */}
             <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Best Performing Channel</h3>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">{bestChannel.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Revenue</p>
                      <p className="text-sm font-black text-white">{fmtK(bestChannel.revenue)}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Conversion</p>
                      <p className="text-sm font-black text-white">1.5%</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">ROI</p>
                      <p className="text-sm font-black text-emerald-400">365%</p>
                   </div>
                </div>
             </div>

             {/* Needs Improvement */}
             <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6 border-l-4 border-rose-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Needs Improvement</h3>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">{needsImprovement.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Visitors</p>
                      <p className="text-sm font-black text-white">{needsImprovement.visitors.toLocaleString()}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Conversion</p>
                      <p className="text-sm font-black text-rose-400">0.5%</p>
                   </div>
                   <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 font-medium">High traffic but low conversion — optimize targeting</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Channel Performance Table */}
          <div className="bg-[#11151b] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-sm font-black text-white">Channel Performance</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.01]">
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Visitors</th>
                  <th className="px-6 py-4">Leads</th>
                  <th className="px-6 py-4">Customers</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Conv %</th>
                  <th className="px-6 py-4">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {channels.map((ch, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span className="text-[11px] font-bold text-gray-200">{ch.name}</span>
                      {i === 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black uppercase">Best</span>}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-gray-400">{ch.visitors.toLocaleString()}</td>
                    <td className="px-6 py-4 text-[11px] font-medium text-gray-400">{ch.leads}</td>
                    <td className="px-6 py-4 text-[11px] font-medium text-gray-400">{ch.customers}</td>
                    <td className="px-6 py-4 text-[11px] font-black text-white">{fmtK(ch.revenue)}</td>
                    <td className="px-6 py-4 text-[11px] font-black text-emerald-400">{(ch.customers/ch.visitors*100).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-300">{ch.spend > 0 ? `${Math.round((ch.revenue - ch.spend)/ch.spend * 100)}%` : '∞%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
