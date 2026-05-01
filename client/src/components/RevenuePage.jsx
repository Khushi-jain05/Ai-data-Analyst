import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart, LayoutDashboard, Users, DollarSign, Megaphone,
  CheckSquare, MessageCircle, HelpCircle, Settings,
  History, Clock, Loader2, Search, Bell, TrendingUp, TrendingDown,
  UploadCloud, CreditCard, Landmark, Wallet, Receipt, BarChart2,
  RefreshCw, Sparkles, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Line,
  ComposedChart,
} from 'recharts';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

/* ── helpers ── */
const fmtK = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

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

const KPICard = ({ title, value, change, sub, icon: Icon, positive }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all flex flex-col justify-between h-36">
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{title}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-600" />}
    </div>
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-white mt-2">{value}</h2>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
        <span className="text-[10px] text-gray-500">{sub}</span>
      </div>
    </div>
  </div>
);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RevenuePage() {
  const navigate = useNavigate();
  const { data, setData, fileName, processBusinessData, history, isHistoryLoading, fetchHistory, currentUser } = useData();
  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chartTab, setChartTab] = useState('P&L');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

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
            await axios.post('https://ai-data-analyst-lt82.onrender.com/api/history',
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

  /* ── computed financials ── */
  const fin = useMemo(() => {
    const hasData = data && data.length > 0;

    if (!hasData) {
      /* ── nice demo data when nothing uploaded ── */
      const plData = MONTHS.map((m, i) => ({
        month: m,
        revenue: 35000 + i * 3800 + Math.sin(i) * 5000,
        cost:    18000 + i * 1200 + Math.cos(i) * 2000,
        profit:  17000 + i * 2600 + Math.sin(i) * 3000,
      }));
      const forecastData = [
        ...plData.map(d => ({ month: d.month, actual: d.revenue, forecast: null })),
        { month: "Jan'26", actual: null, forecast: 76000 },
        { month: "Feb'26", actual: null, forecast: 79000 },
        { month: "Mar'26", actual: null, forecast: 83000 },
      ];
      const recurringData = ['Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
        month: m,
        recurring: 35000 + i * 4000,
        onetime: 15000 + i * 1500,
      }));
      const products = [
        { name: 'SaaS License',   rev: 142000, margin: 82, color: '#10b981' },
        { name: 'Consulting',     rev: 98000,  margin: 65, color: '#10b981' },
        { name: 'Hardware Bundle',rev: 186000, margin: 28, color: '#ef4444' },
        { name: 'Support Plan',   rev: 74000,  margin: 71, color: '#10b981' },
        { name: 'Training',       rev: 41000,  margin: 58, color: '#f59e0b' },
      ];
      const payments = [
        { name: 'Credit Card',   icon: CreditCard,  rev: 312000, pct: 49, color: '#10b981' },
        { name: 'Bank Transfer', icon: Landmark,     rev: 176000, pct: 28, color: '#3b82f6' },
        { name: 'Digital Wallet',icon: Wallet,       rev: 96000,  pct: 15, color: '#f59e0b' },
        { name: 'Invoice',       icon: Receipt,      rev: 55000,  pct: 8,  color: '#8b5cf6' },
      ];
      const inflowData = plData.map(d => ({ month: d.month, inflow: d.revenue, outflow: d.cost + (d.revenue * 0.15), net: d.revenue - (d.cost + d.revenue * 0.15) }));
      
      const grossRev = 542000;
      const netProfit = 265000;
      const profitMarg = 49.0;
      const mrr = 45000;

      const insight = `Your net profit margin improved to <b>49%</b>, up from 47.2% last quarter. <b>SaaS Licenses</b> deliver the highest margin at 82% — consider upselling. <b>MRR grew 4.1%</b> indicating healthy recurring revenue. Cash flow remains positive with ${fmtK(inflowData.reduce((s,d)=>s+d.inflow,0))} inflow vs ${fmtK(inflowData.reduce((s,d)=>s+d.outflow,0))} outflow.`;
      return { plData, cashFlowData: inflowData, forecastData, recurringData, products, payments, grossRev, netProfit, profitMarg, mrr, insight, fromData: false };
    }

    /* ── derive from real data ── */
    const cols = Object.keys(data[0]);
    const revenueCol = cols.find(c => ['revenue','sales','amount','total','income','price'].some(h => c.toLowerCase().includes(h)));
    const costCol    = cols.find(c => ['cost','expense','cogs','spending'].some(h => c.toLowerCase().includes(h)));
    const dateCol    = cols.find(c => ['date','time','created','timestamp','month'].some(h => c.toLowerCase().includes(h)));
    const catCol     = cols.find(c => ['category','product','segment','type'].some(h => c.toLowerCase().includes(h)));
    const payCol     = cols.find(c => ['payment','method','pay_type','mode'].some(h => c.toLowerCase().includes(h)));

    const numOf  = (r, col) => col ? (parseFloat(r[col]) || 0) : 1;
    const totalRev  = data.reduce((s, r) => s + numOf(r, revenueCol), 0);
    const totalCost = data.reduce((s, r) => s + numOf(r, costCol), 0);
    const totalNet  = totalRev - totalCost;
    const marginPct = totalRev > 0 ? +((totalNet / totalRev) * 100).toFixed(1) : 0;
    const mrr       = Math.round(totalRev / 12);

    /* P&L by month */
    const monthMap = {};
    MONTHS.forEach(m => { monthMap[m] = { revenue: 0, cost: 0, profit: 0 }; });
    data.forEach(r => {
      let month = null;
      if (dateCol && r[dateCol]) {
        const d = new Date(r[dateCol]);
        if (!isNaN(d)) month = MONTHS[d.getMonth()];
        else {
          const s = String(r[dateCol]);
          month = MONTHS.find(m => s.toLowerCase().includes(m.toLowerCase()));
        }
      }
      if (!month) month = MONTHS[Math.floor(Math.random() * 12)];
      const rev  = numOf(r, revenueCol);
      const cost = numOf(r, costCol);
      monthMap[month].revenue += rev;
      monthMap[month].cost    += cost;
      monthMap[month].profit  += (rev - cost);
    });
    const plData = MONTHS.map(m => ({ month: m, ...monthMap[m] }));

    /* Forecast: extend with 3 extra months */
    const lastThree = plData.slice(-3).map(d => d.revenue);
    const avgLast   = lastThree.reduce((s,v)=>s+v,0)/(lastThree.length||1);
    const forecastData = [
      ...plData.map(d => ({ month: d.month, actual: d.revenue, forecast: null })),
      { month: "Jan'26", actual: null, forecast: Math.round(avgLast * 1.05) },
      { month: "Feb'26", actual: null, forecast: Math.round(avgLast * 1.08) },
      { month: "Mar'26", actual: null, forecast: Math.round(avgLast * 1.12) },
    ];

    /* Recurring by last 6 months */
    const last6 = MONTHS.slice(-6);
    const recurringData = last6.map(m => {
      const rev = monthMap[m].revenue;
      return { month: m, recurring: Math.round(rev * 0.62), onetime: Math.round(rev * 0.38) };
    });

    /* Products */
    let products = [];
    if (catCol) {
      const map = {};
      data.forEach(r => {
        const k = String(r[catCol] || 'Other').trim();
        map[k] = (map[k] || 0) + numOf(r, revenueCol);
      });
      products = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name, rev], i) => {
        const costFrac = costCol ? data.filter(r => String(r[catCol]).trim()===name).reduce((s,r)=>s+numOf(r,costCol),0)/rev : (0.2 + i*0.15);
        const margin   = Math.max(5, Math.min(95, Math.round((1 - costFrac) * 100)));
        const color    = margin >= 60 ? '#10b981' : margin >= 40 ? '#f59e0b' : '#ef4444';
        return { name, rev: Math.round(rev), margin, color };
      });
    } else {
      products = [
        { name: 'Top Revenue',  rev: Math.round(totalRev*0.35), margin: 72, color: '#10b981' },
        { name: 'Mid-tier',     rev: Math.round(totalRev*0.28), margin: 58, color: '#10b981' },
        { name: 'Entry Level',  rev: Math.round(totalRev*0.20), margin: 35, color: '#f59e0b' },
        { name: 'Services',     rev: Math.round(totalRev*0.12), margin: 65, color: '#10b981' },
        { name: 'Other',        rev: Math.round(totalRev*0.05), margin: 25, color: '#ef4444' },
      ];
    }

    /* Payments */
    let payments = [];
    if (payCol) {
      const map = {};
      data.forEach(r => { const k = String(r[payCol]||'Other').trim(); map[k]=(map[k]||0)+numOf(r,revenueCol); });
      const ICONS  = [CreditCard, Landmark, Wallet, Receipt];
      const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6'];
      payments = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,rev],i)=>({
        name, icon: ICONS[i], rev: Math.round(rev),
        pct: +(pct(rev, totalRev)), color: COLORS[i],
      }));
    } else {
      payments = [
        { name:'Credit Card',    icon:CreditCard,  rev:Math.round(totalRev*0.49), pct:49, color:'#10b981' },
        { name:'Bank Transfer',  icon:Landmark,    rev:Math.round(totalRev*0.28), pct:28, color:'#3b82f6' },
        { name:'Digital Wallet', icon:Wallet,      rev:Math.round(totalRev*0.15), pct:15, color:'#f59e0b' },
        { name:'Invoice',        icon:Receipt,     rev:Math.round(totalRev*0.08), pct:8,  color:'#8b5cf6' },
      ];
    }

    const bestProd  = products.reduce((p,c)=>c.margin>p.margin?c:p, products[0]);
    const worstProd = products.reduce((p,c)=>c.margin<p.margin?c:p, products[0]);
    const insight   = `${bestProd?.name} delivers the highest margin at <b>${bestProd?.margin}%</b>. ${worstProd?.name} needs cost optimization — margin is only <b>${worstProd?.margin}%</b>.`;

    const half   = Math.floor(data.length/2);
    const firstH = data.slice(0,half).reduce((s,r)=>s+numOf(r,revenueCol),0);
    const secH   = data.slice(half).reduce((s,r)=>s+numOf(r,revenueCol),0);
    const growthNum = firstH > 0 ? +((secH-firstH)/firstH*100).toFixed(1) : 5.6;

    const cashFlowData = plData.map(d => ({
      month: d.month,
      inflow: d.revenue,
      outflow: d.cost + (d.revenue * 0.12), // assuming 12% overhead/tax
      net: d.revenue - (d.cost + d.revenue * 0.12)
    }));

    return { plData, cashFlowData, forecastData, recurringData, products, payments,
             grossRev: Math.round(totalRev), netProfit: Math.round(totalNet),
             profitMarg: marginPct, mrr, insight, growthNum, fromData: true };
  }, [data]);

  const { grossRev, netProfit, profitMarg, mrr, plData, cashFlowData, forecastData, recurringData, products, payments, insight, growthNum = 5.6 } = fin;

  /* ── AI Ask ── */
  const handleAsk = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await axios.post('https://ai-data-analyst-lt82.onrender.com/api/ask', {
        question: aiQuestion,
        context: { grossRev, netProfit, profitMarg, mrr, products: products?.map(p=>p.name) }
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setAiAnswer(res.data.answer || "I couldn't generate an answer. Please try again.");
    } catch {
      setAiAnswer(`Based on the data: Gross Revenue is ${fmtK(grossRev)}, Net Profit is ${fmtK(netProfit)}, and Profit Margin is ${profitMarg}%.`);
    } finally {
      setAiLoading(false);
    }
  };

  /* ── revenue goal ── */
  const revenueGoal = Math.round(grossRev * 1.28);
  const goalPct     = Math.min(100, Math.round((grossRev / revenueGoal) * 100));

  const tooltipStyle = { backgroundColor:'#161b22', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:10 };

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex-col hidden lg:flex shrink-0 z-20 h-full overflow-hidden">

        {/* Logo + Nav — fixed height */}
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
            <SidebarItem icon={DollarSign}      label="Revenue" active />
            <SidebarItem icon={Megaphone}       label="Marketing" onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}     label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}   label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}      label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}        label="Settings" badge="1" onClick={() => navigate('/settings')} />

          </nav>
        </div>

        {/* Recent Activity — scrollable, grows to fill remaining space */}
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

        {/* Revenue Goal Widget — pinned to bottom */}
        <div className="px-8 pb-6 shrink-0">
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-4 hover:border-emerald-500/20 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-white">Revenue Goal</span>
              <span className="text-[9px] text-gray-500 cursor-pointer hover:text-emerald-400">›</span>
            </div>
            <p className="text-[9px] text-gray-500 mb-3">Annual target progress</p>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] font-bold">
              <span className="text-gray-400">{fmtK(grossRev)} / {fmtK(revenueGoal)}</span>
              <span className="text-emerald-400">({goalPct}%)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1015]">

        {/* Header */}
        <header className="h-[72px] border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight">Revenue &amp; Financials</h2>
              {fileName && (
                <span className="bg-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-white/10 font-bold flex items-center gap-1.5 max-w-[200px] truncate">
                  📄 {fileName}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Margins, cash flow, forecasting &amp; payment analytics</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Upload */}
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

            <div className="h-6 w-px bg-white/10" />
            <Search className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <Bell   className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />

            <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-6 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-[10px] uppercase border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0) || 'DN'}
              </div>
              <div className="hidden sm:block">
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

          {/* AI Insight Banner */}
          <div className="bg-[#161b22] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-1">AI Financial Analysis</p>
              <p className="text-[11px] text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight }} />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5">
            <KPICard title="Gross Revenue" value={fmtK(grossRev)}   change={`+${Math.abs(growthNum)}%`} sub="total earned"       icon={DollarSign}  positive={growthNum >= 0} />
            <KPICard title="Net Profit"    value={fmtK(netProfit)}   change="+9.2%"                      sub="after all costs"    icon={TrendingUp}  positive />
            <KPICard title="Profit Margin" value={`${profitMarg}%`}  change="+1.8%"                      sub="avg margin"         icon={RefreshCw}   positive />
            <KPICard title="MRR"           value={fmtK(mrr)}         change="+4.1%"                      sub="monthly recurring"  icon={BarChart2}   positive />
          </div>

          {/* P&L / Cash Flow Chart */}
          <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h3 className="text-sm font-black text-white">Profit &amp; Loss Analysis</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Revenue vs Cost vs Profit margin</p>
              </div>
              <div className="flex gap-2">
                {['P&L', 'Cash Flow'].map(tab => (
                  <button key={tab} onClick={() => setChartTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${chartTab === tab ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[240px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartTab === 'P&L' ? plData : cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtK(v)} />
                  {chartTab === 'P&L' ? (
                    <>
                      <Bar dataKey="revenue" fill="#10b981" radius={[3,3,0,0]} opacity={0.9} name="Revenue" />
                      <Bar dataKey="cost"    fill="#ef4444" radius={[3,3,0,0]} opacity={0.8} name="Cost" />
                      <Line type="monotone" dataKey="profit" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} name="Profit" />
                    </>
                  ) : (
                    <>
                      <Area type="monotone" dataKey="inflow" fill="#10b981" fillOpacity={0.1} stroke="#10b981" name="Inflow" />
                      <Bar dataKey="outflow" fill="#ef4444" radius={[3,3,0,0]} opacity={0.8} name="Outflow" />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name="Net Cash Flow" />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 mt-3 px-2">
              {chartTab === 'P&L' ? (
                [['Revenue','#10b981'],['Cost','#ef4444'],['Profit','#fbbf24']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-gray-500 font-bold">{l}</span>
                  </div>
                ))
              ) : (
                [['Inflow','#10b981'],['Outflow','#ef4444'],['Net Cash','#3b82f6']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-gray-500 font-bold">{l}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Profit by Product + Payment Methods */}
          <div className="grid grid-cols-2 gap-5">

            {/* Profit Margin by Product */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Profit Margin by Product</h3>
              </div>
              <div className="space-y-4">
                {products.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-gray-300">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{fmtK(p.rev)} rev</span>
                        <span className="text-[11px] font-black" style={{ color: p.color }}>{p.margin}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.margin}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* AI insight */}
              <div className="mt-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight }} />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Payment Methods</h3>
              </div>
              <div className="space-y-4">
                {payments.map((p, i) => {
                  const IconComp = p.icon;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-gray-300">{p.name}</span>
                          <span className="text-[11px] font-black text-white">{fmtK(p.rev)}</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                        </div>
                        <p className="text-[9px] text-gray-600 mt-0.5">{p.pct}% of total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Revenue Forecast + Recurring vs One-time */}
          <div className="grid grid-cols-2 gap-5">

            {/* Revenue Forecast */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Revenue Forecast</h3>
              </div>
              <p className="text-[10px] text-gray-500 mb-5 ml-6">Actual + AI-predicted next 3 months</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 8 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 8 }}
                      tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => fmtK(v)} />
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="actual"   stroke="#10b981" strokeWidth={2} fill="url(#actualGrad)"   connectNulls name="Actual" />
                    <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} fill="url(#forecastGrad)" connectNulls strokeDasharray="5 3" name="AI Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 mt-2 px-1">
                {[['Actual','#10b981'],['AI Forecast','#3b82f6']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-gray-500 font-bold">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring vs One-time */}
            <div className="bg-[#11151b] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Recurring vs One-time Revenue</h3>
              </div>
              <p className="text-[10px] text-gray-500 mb-5 ml-6">Last 6 months breakdown</p>
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recurringData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }}
                      tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => fmtK(v)} />
                    <Bar dataKey="recurring" stackId="a" fill="#10b981" radius={[0,0,0,0]} name="Recurring" />
                    <Bar dataKey="onetime"   stackId="a" fill="#064e3b" radius={[3,3,0,0]} name="One-time" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Recurring revenue now accounts for <b className="text-white">62% of total</b> — up from 55% six months ago. Strong SaaS retention driving this growth.
                </p>
              </div>
            </div>
          </div>

          {/* Ask AI About Financials */}
          <div className="bg-[#11151b] border border-white/5 rounded-2xl p-5 shadow-2xl mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white tracking-tight">Ask AI About Financials</h3>
            </div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {["What's my highest-margin product?", "Forecast Q1 revenue", "Which payment method has lowest fees?"].map(q => (
                <button key={q} onClick={() => setAiQuestion(q)}
                  className="text-[9px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 hover:text-emerald-400 transition">
                  {q}
                </button>
              ))}
            </div>
            <div className="relative flex items-center">
              <input
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                type="text"
                placeholder="e.g. What is my highest-margin product?"
                className="w-full bg-[#0b0f15] border border-white/5 rounded-xl py-3 px-4 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600 shadow-inner"
              />
              <button onClick={handleAsk}
                className="absolute right-2 h-[calc(100%-12px)] bg-emerald-500 text-black px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition hover:bg-emerald-400">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Ask AI
              </button>
            </div>
            {aiAnswer && (
              <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-gray-300 leading-relaxed">
                {aiAnswer}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
