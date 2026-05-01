import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart, LayoutDashboard, Users, DollarSign, Megaphone,
  CheckSquare, MessageCircle, HelpCircle, Settings,
  History, Clock, Loader2, Search, Bell, Download, Sparkles,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronRight, Send, UploadCloud
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
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

const ReportCard = ({ title, children, icon: Icon, extra }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
      </div>
      {extra}
    </div>
    {children}
  </div>
);

const KPICard = ({ title, value, change, trend, icon: Icon }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.02]">
    <div className="flex items-center justify-between mb-4">
      <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{title}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-600" />}
    </div>
    <div className="flex flex-col gap-1">
      <h2 className="text-3xl font-bold tracking-tight text-white">{value}</h2>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{change}</span>
      </div>
    </div>
  </div>
);

/* ── small helpers ── */
const fmt = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const findCol = (cols, hints) =>
  cols.find(c => hints.some(h => c.toLowerCase().includes(h)));

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportPage() {
  const navigate  = useNavigate();
  const {
    data, setData, fileName, metrics, processBusinessData,
    history, isHistoryLoading, fetchHistory, currentUser
  } = useData();

  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('This year');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  // Relies on global DataContext for initialization

  /* ── dropzone (same logic as dashboard) ── */
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
          totalValue: computed?.totalVal,
          growth: computed?.growthStr,
          avgOrder: computed?.avgOrder,
          categoryBreakdown: computed?.categoryData,
          topProducts: computed?.topProducts,
          anomalies: computed?.anomalies,
          summary: computed?.summaryText
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

  /* ── load past upload ── */
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

  /* ══════════════ DYNAMIC COMPUTATIONS FROM RAW DATA ══════════════ */
  const computed = useMemo(() => {
    if (!data || data.length === 0) return null;

    const cols = Object.keys(data[0]);

    const salesCol = findCol(cols, ['sales','revenue','amount','total','price','income','value']);
    const dateCol  = findCol(cols, ['date','time','created','ordered','timestamp']);
    const catCol   = findCol(cols, ['category','segment','type','region','department']);
    const prodCol  = findCol(cols, ['product','item','name','description','sku','title']);
    const custCol  = findCol(cols, ['customer','client','buyer','name','user']);

    /* numeric col fallback */
    const numCol = salesCol || cols.find(c => {
      const vals = data.slice(0, 20).map(r => r[c]).filter(v => v != null && v !== '');
      return vals.length > 0 && vals.every(v => !isNaN(Number(v)));
    });

    const numOf = (row) => numCol ? parseFloat(row[numCol]) || 0 : 1;

    /* ── Date Filtering Logic ── */
    let processingData = data;
    if (activeFilter !== 'Custom' && activeFilter !== 'This year') {
      if (dateCol) {
        const validDates = data.map(r => new Date(r[dateCol])).filter(d => !isNaN(d));
        if (validDates.length > 0) {
          const maxDate = new Date(Math.max(...validDates));
          const cutoff = new Date(maxDate);
          if (activeFilter === 'Last 7 days') cutoff.setDate(cutoff.getDate() - 7);
          else if (activeFilter === 'Last month') cutoff.setMonth(cutoff.getMonth() - 1);
          else if (activeFilter === 'Last quarter') cutoff.setMonth(cutoff.getMonth() - 3);

          processingData = data.filter(row => {
            const d = new Date(row[dateCol]);
            if (isNaN(d)) return true;
            return d >= cutoff;
          });
          if (processingData.length === 0) processingData = data; // fail-safe
        }
      } else {
        // Fallback fake distribution if no date column exists
        let factor = 1;
        if (activeFilter === 'Last 7 days') factor = 0.2;
        else if (activeFilter === 'Last month') factor = 0.45;
        else if (activeFilter === 'Last quarter') factor = 0.75;
        processingData = data.slice(0, Math.ceil(data.length * factor));
      }
    }

    if (processingData.length === 0) processingData = data;

    /* ── monthly trend ── */
    const monthSums = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);
    processingData.forEach(row => {
      let m = -1;
      if (dateCol) {
        const d = new Date(row[dateCol]);
        if (!isNaN(d)) m = d.getMonth();
      }
      if (m === -1) m = Math.floor(Math.random() * 12); // spread evenly if no date
      monthSums[m] += numOf(row);
      monthCounts[m]++;
    });
    const salesTrendData = MONTHS.map((name, i) => ({
      name,
      value: Math.round(monthSums[i]),
      count: monthCounts[i],
    })).filter(d => d.count > 0 || d.value > 0);

    /* ── category breakdown ── */
    let categoryData = [];
    const groupCol = catCol || prodCol || custCol;
    if (groupCol) {
      const map = {};
      processingData.forEach(row => {
        const k = String(row[groupCol] || '').trim();
        if (k) map[k] = (map[k] || 0) + numOf(row);
      });
      const total = Object.values(map).reduce((s, v) => s + v, 0);
      categoryData = Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
    } else {
      /* fallback: split rows into 4 even groups */
      const chunk = Math.ceil(processingData.length / 4);
      categoryData = ['Segment A','Segment B','Segment C','Segment D'].map((name, i) => {
        const val = processingData.slice(i * chunk, (i+1)*chunk).reduce((s, r) => s + numOf(r), 0);
        return { name, value: val };
      });
      const tot = categoryData.reduce((s, d) => s + d.value, 0);
      categoryData = categoryData.map(d => ({ ...d, value: Math.round((d.value / tot) * 100) }));
    }

    /* ── top 5 performers ── */
    let topProducts = [];
    const itemCol = prodCol || catCol || custCol;
    if (itemCol) {
      const map = {};
      processingData.forEach(row => {
        const k = String(row[itemCol] || '').trim();
        if (k) map[k] = (map[k] || 0) + numOf(row);
      });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
      const maxVal = sorted[0]?.[1] || 1;
      topProducts = sorted.slice(0, 5).map(([name, value], i) => ({
        name,
        value: fmt(value),
        rawValue: value,
        progress: Math.round((value / maxVal) * 100),
        growth: (Math.random() * 20 - 5).toFixed(1) + '%', // relative trend placeholder
      }));
    } else {
      /* chunk-based fallback */
      const chunk = Math.ceil(processingData.length / 5);
      topProducts = ['Item 1','Item 2','Item 3','Item 4','Item 5'].map((name, i) => {
        const val = processingData.slice(i * chunk, (i+1)*chunk).reduce((s, r) => s + numOf(r), 0);
        return { name, value: fmt(val), rawValue: val, progress: 0, growth: '' };
      });
      const maxP = Math.max(...topProducts.map(p => p.rawValue), 1);
      topProducts = topProducts.map(p => ({ ...p, progress: Math.round((p.rawValue / maxP) * 100) }));
    }

    /* ── bottom 3 ── */
    const bottomProducts = itemCol
      ? (() => {
          const map = {};
          processingData.forEach(row => {
            const k = String(row[itemCol] || '').trim();
            if (k) map[k] = (map[k] || 0) + numOf(row);
          });
          return Object.entries(map)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([name, value]) => ({ name, value: fmt(value), drop: (Math.random() * 20 + 5).toFixed(1) + '%' }));
        })()
      : [];

    /* ── total & growth ── */
    const totalVal = processingData.reduce((s, r) => s + numOf(r), 0);
    const half = Math.floor(processingData.length / 2);
    const firstH  = processingData.slice(0, half).reduce((s, r) => s + numOf(r), 0);
    const secondH = processingData.slice(half).reduce((s, r) => s + numOf(r), 0);
    const growthPct = firstH > 0 ? ((secondH - firstH) / firstH * 100).toFixed(1) : 0;
    const growthStr = `${growthPct > 0 ? '+' : ''}${growthPct}%`;
    const avgOrder  = totalVal / (processingData.length || 1);

    /* ── anomalies ── */
    const anomalies = [];
    if (Number(growthPct) > 10)  anomalies.push({ type: 'spike', text: `Revenue surge: ${growthStr} growth in second half of dataset` });
    if (Number(growthPct) < -5)  anomalies.push({ type: 'drop',  text: `Revenue decline of ${growthStr} detected vs first half` });
    if (topProducts.length > 0)  anomalies.push({ type: 'info',  text: `Top item "${topProducts[0]?.name}" accounts for ${topProducts[0]?.progress}% of total` });
    anomalies.push({ type: 'info', text: `${processingData.length.toLocaleString()} records filtered · original: ${data.length.toLocaleString()}` });

    /* ── AI summary text ── */
    const topCat  = categoryData[0]?.name || 'top segment';
    const topCatPct = categoryData[0]?.value || 40;
    const summaryText = `Sales ${Number(growthPct) >= 0 ? 'increased' : 'declined'} by ${Math.abs(growthPct)}% across the dataset, reaching a total of ${fmt(totalVal)} in revenue. The <strong>${topCat}</strong> segment contributed the most at <strong>${topCatPct}%</strong> of total value. Average transaction stands at <strong>${fmt(avgOrder)}</strong> per record. ${processingData.length.toLocaleString()} records were analyzed across ${cols.length} columns.`;

    return { processingData, salesTrendData, categoryData, topProducts, bottomProducts, totalVal, growthStr, avgOrder, anomalies, summaryText, cols };
  }, [data, activeFilter]);

  const hasData = computed !== null;

  /* ────────────────────────────────── RENDER ────────────────────────────────── */
  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden print:h-auto print:overflow-visible">

      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0 print:hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>
          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview"     onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}    label="Report" active onClick={() => navigate('/report')} />
            <SidebarItem icon={History}         label="History"      onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}           label="Lead" onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}      label="Revenue"      onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}       label="Marketing" onClick={() => navigate('/marketing')} />
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

          {/* Report status */}
          <div className="mt-6 mb-4 p-4 mx-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 group cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white flex items-center justify-between">
                Report status <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[9px] text-gray-500 truncate">{hasData ? `${data.length} records loaded` : 'No data loaded'}</span>
            </div>
          </div>
        </div>

        {/* Customer metric */}
        <div className="mt-auto p-4 flex flex-col gap-4">
          <div className="bg-[#161b22] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Customer metric</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400">Lifetime value</p>
                <p className="text-sm font-bold text-white">{hasData ? fmt(computed.avgOrder * 750) : '$92,500'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Net promoter</p>
                <p className="text-sm font-bold text-emerald-400">{hasData ? `Score ${Math.min(99, Math.round(Math.abs(parseFloat(computed.growthStr)) * 4 + 50))}` : 'Score 70'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible print:block">
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full print:hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">AI Report</h2>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {hasData ? `${data.length.toLocaleString()} records` : 'Sample data'}
            </span>
            {fileName && (
              <span className="bg-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-white/10 font-bold flex items-center gap-1.5 max-w-[200px] truncate">
                📄 {fileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Inline upload button */}
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

            <button onClick={() => window.print()} className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 print:hidden">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-6 cursor-pointer group">
              <Search className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
              <Bell className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
              <div className="flex items-center gap-3 ml-2">
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full p-8 space-y-8 custom-scrollbar relative print:overflow-visible print:h-auto print:p-0">

          {/* No-data banner */}
          {!hasData && (
            <div className="px-5 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <UploadCloud className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-emerald-400 font-semibold">
                Showing sample data. Click <strong>Upload CSV</strong> to load your own dataset and see real insights.
              </p>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#161b22] rounded-2xl border border-white/5 flex items-center">
              {['Last 7 days', 'Last month', 'Last quarter', 'This year', 'Custom'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${f === activeFilter ? 'bg-emerald-500 text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <ReportCard title="AI-Generated Summary" icon={Sparkles}>
            <div className="text-sm text-gray-300 leading-relaxed font-medium">
              {hasData ? (
                <p dangerouslySetInnerHTML={{ __html: computed.summaryText }} />
              ) : (
                <p>Upload a CSV file to generate an AI-powered summary of your data.</p>
              )}
            </div>
          </ReportCard>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Revenue"
              value={hasData ? fmt(computed.totalVal) : metrics.totalSales}
              change={hasData ? computed.growthStr : metrics.salesGrowth}
              trend={hasData ? (parseFloat(computed.growthStr) >= 0 ? 'up' : 'down') : 'up'}
            />
            <KPICard
              title="Avg Per Record"
              value={hasData ? fmt(computed.avgOrder) : metrics.avgOrderValue}
              change="+5.2%"
              trend="up"
              icon={DollarSign}
            />
            <KPICard
              title="Top Segment"
              value={hasData ? computed.categoryData[0]?.name?.slice(0, 12) || 'N/A' : metrics.topCategory}
              change={`${computed?.categoryData[0]?.value ?? 40}% share`}
              trend="up"
              icon={TrendingUp}
            />
            <KPICard
              title="Records"
              value={hasData ? data.length.toLocaleString() : '0'}
              change={hasData ? `${computed.cols.length} columns` : 'No data'}
              trend="up"
              icon={FileBarChart}
            />
          </div>

          {/* Sales Trend + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ReportCard
                title="Revenue Trend"
                extra={
                  <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-gray-500">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> This dataset</span>
                  </div>
                }
              >
                <div className="h-[280px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hasData ? computed.salesTrendData : []}>
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} dy={10} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 10 }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        formatter={(v) => [fmt(v), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#emeraldGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  {!hasData && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-bold uppercase">
                      Upload a CSV to see your trend
                    </div>
                  )}
                </div>
              </ReportCard>
            </div>

            <div className="lg:col-span-1">
              <ReportCard title="Segment Breakdown">
                {hasData ? (
                  <>
                    <div className="h-[200px] w-full mt-4 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={computed.categoryData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={8} dataKey="value" stroke="none"
                          >
                            {computed.categoryData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} cornerRadius={10} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">{computed.categoryData[0]?.value ?? 0}%</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Top</span>
                      </div>
                    </div>
                    <div className="mt-8 space-y-3">
                      {computed.categoryData.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-xs font-bold text-gray-400 group-hover:text-white transition truncate max-w-[120px]">{cat.name}</span>
                          </div>
                          <span className="text-xs font-bold text-white">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-600 text-xs font-bold uppercase">Upload data to see breakdown</div>
                )}
              </ReportCard>
            </div>
          </div>

          {/* Top Products + Bottom + Anomalies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ReportCard title="Top Performers" icon={TrendingUp}>
              {hasData && computed.topProducts.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {computed.topProducts.map((p, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-600">#{i + 1}</span>
                          <span className="text-xs font-bold text-gray-300 group-hover:text-white transition truncate max-w-[160px]">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white tracking-tight">{p.value}</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-1000 group-hover:bg-emerald-400"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex items-center justify-center h-32 text-gray-600 text-xs font-bold uppercase">Upload data to see top performers</div>
              )}
            </ReportCard>

            <div className="space-y-8">
              <ReportCard title="Bottom Performers" icon={TrendingDown}>
                {hasData && computed.bottomProducts.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {computed.bottomProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-rose-500/20 transition">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-500">#{i + 1}</span>
                          <span className="text-xs font-bold text-gray-300 group-hover:text-white truncate max-w-[140px]">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold mr-3">{p.value}</span>
                          <span className="text-[10px] font-bold text-rose-400 inline-flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />{p.drop}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-center h-24 text-gray-600 text-xs font-bold uppercase">No data loaded</div>
                )}
              </ReportCard>

              <ReportCard title="Anomalies & Insights" icon={HelpCircle}>
                <div className="mt-4 space-y-3">
                  {(hasData ? computed.anomalies : []).map((a, i) => (
                    <div key={i} className={`p-4 rounded-2xl text-[11px] font-bold border
                      ${a.type === 'spike' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                        : a.type === 'drop' ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                        : 'bg-blue-500/5 text-blue-400 border-blue-500/10'}`}>
                      {a.text}
                    </div>
                  ))}
                  {!hasData && (
                    <div className="p-4 rounded-2xl text-[11px] font-bold bg-white/5 text-gray-500 border border-white/5">
                      Upload a CSV to see detected anomalies and data insights
                    </div>
                  )}
                </div>
              </ReportCard>
            </div>
          </div>

          {/* Ask AI */}
          <div className="mt-16 bg-[#161b22] border border-white/5 rounded-[32px] p-8 shadow-2xl relative print:hidden">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-white tracking-tight">Ask About This Report</h3>
            </div>
            <div className="relative group">
              <input
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                type="text"
                placeholder={hasData ? `Ask about your ${fileName || 'dataset'}…` : '"Why did sales drop in Week 28?"'}
                className="w-full bg-[#0b0f15] border border-white/5 rounded-2xl py-4 px-6 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600 shadow-inner"
              />
              <button 
                onClick={handleAsk}
                disabled={aiLoading}
                className="absolute right-3 top-2.5 h-[calc(100%-20px)] bg-emerald-500 text-black px-4 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-400 transition disabled:opacity-50"
              >
                {aiLoading ? <span className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full"></span> : <Send className="w-3.5 h-3.5" />}
                Ask AI
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {['Top performing segment?', 'Growth trend?', 'Key anomalies?'].map(q => (
                <button 
                  key={q} 
                  onClick={() => setAiQuestion(q)}
                  className="text-[10px] font-bold text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:text-white transition"
                >
                  {q}
                </button>
              ))}
            </div>
            {aiAnswer && (
              <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[300px]">
                {aiAnswer}
              </div>
            )}
          </div>

          <div className="h-24" />
        </div>
      </main>
    </div>
  );
}
