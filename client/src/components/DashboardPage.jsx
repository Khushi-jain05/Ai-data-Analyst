import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  ResponsiveContainer, LineChart, Line,
  BarChart, Bar, Cell, PieChart, Pie,
  Tooltip, XAxis, YAxis
} from 'recharts';
import {
  LayoutDashboard, FileBarChart, Users, DollarSign,
  Megaphone, CheckSquare, MessageCircle, HelpCircle,
  History as HistoryIcon, Settings, Loader2, Search, Bell,
  ChevronRight, UploadCloud, ArrowUpRight, MoreHorizontal,
  Clock
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';

/* ── Sidebar item — identical style to ReportPage ── */
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

/* ── Card — identical bg/border/radius to ReportPage's ReportCard ── */
const Card = ({ title, children, headerRight, className = '' }) => (
  <div className={`bg-[#161b22] border border-white/5 rounded-[24px] p-5 flex flex-col
    hover:border-emerald-500/20 transition-all duration-300 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      {headerRight}
    </div>
    {children}
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, setData, fileName, metrics, history, isHistoryLoading, fetchHistory, processBusinessData, currentUser } = useData();

  const [isUploading, setIsUploading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(data && data.length > 0);
  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
    };
    checkToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => { if (data?.length) setDataLoaded(true); }, [data]);

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
          setDataLoaded(true);
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
      error: () => setIsUploading(false)
    });
  }, [setData, fetchHistory, processBusinessData]);

  /* load a past dataset from history */
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
      setDataLoaded(true);
    } catch (err) {
      console.error('History load error:', err.message);
    } finally {
      setIsHistoryActionLoading(false);
    }
  };

  const fileInputRef = React.useRef(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, noClick: true });

  if (!currentUser) return (
    <div className="bg-[#0b0f15] h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  const {
    totalSales = '1,200K', salesGrowth = '+2.1%',
    visitorData = [], revenueData = [], retentionRate = 72,
    topCustomers = [], marketShare = [], dailyActivity = [],
    weeklyTasks = { completed: 7, total: 10, pct: 70 }
  } = metrics;

  /* rings for chart */
  const rings = topCustomers.slice(0, 3).map((c, i) => ({
    name: c.name,
    value: [80, 65, 90][i] ?? 60,
    fill:  ['#10b981', '#3b82f6', '#f59e0b'][i],
  }));
  if (rings.length < 3) {
    const defaults = [{ name: 'A', value: 80, fill: '#10b981' }, { name: 'B', value: 65, fill: '#3b82f6' }, { name: 'C', value: 90, fill: '#f59e0b' }];
    while (rings.length < 3) rings.push(defaults[rings.length]);
  }

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden">

      {/* ═══ SIDEBAR — same as ReportPage ═══ */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8">
          {/* Logo + Name — identical to ReportPage */}
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>

          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview" active onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}   label="Report"   onClick={() => navigate('/report')} />
            <SidebarItem icon={HistoryIcon}    label="History"  onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}          label="Lead" onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}     label="Revenue"  onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}      label="Marketing" onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}    label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}  label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}     label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}       label="Settings"   badge="1" onClick={() => navigate('/settings')} />

          </nav>

          {/* Recent Activity — same as ReportPage */}
          <div className="mt-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-3">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {(isHistoryLoading || isHistoryActionLoading) ? (
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Syncing…</span>
                </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryClick(item.id)}
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

          {/* Report status */}
          <div className="mt-4 p-4 mx-0 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 group cursor-pointer transition-all" onClick={() => navigate('/report')}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-white flex items-center justify-between">
                Report status
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[9px] text-gray-500 truncate">
                {dataLoaded ? `${data.length.toLocaleString()} records loaded` : 'No data loaded'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer metric — styled same as ReportPage's bottom card */}
        <div className="mt-auto p-4 flex flex-col gap-4">
          <div className="bg-[#161b22] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">Customer metric</p>
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
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            {fileName && (
              <span className="bg-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-white/10 font-bold flex items-center gap-1.5 max-w-[200px] truncate">
                📄 {fileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">

            {/* ── Inline CSV upload button ── */}
            <div {...getRootProps()} className="relative">
              <input {...getInputProps()} ref={fileInputRef} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all
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

            <Search className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" />
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </div>
            <div className="flex items-center gap-2 ml-4 border-l border-white/10 pl-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs uppercase overflow-hidden">
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>{currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}</>
                )}
              </div>

              <div className="hidden sm:block">
                <p className="text-[11px] font-bold group-hover:text-emerald-400 capitalize">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[9px] text-gray-500">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* No-data hint banner */}
        {!dataLoaded && (
          <div className="mx-8 mt-4 px-5 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <UploadCloud className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-emerald-400 font-semibold">
              Showing sample data. Click <strong>Upload CSV</strong> in the header to load your own dataset.
            </p>
          </div>
        )}

        {/* ── Dashboard Grid ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#0b0f15]">

          {/* ROW 1 */}
          <div className="grid grid-cols-3 gap-6">

            {/* Total Sales */}
            <Card title="Total Sales">
              <div className="flex items-end justify-between flex-1">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold tracking-tight text-white">{totalSales}</span>
                    <span className="text-gray-500 text-base font-bold">$</span>
                    <span className="text-emerald-400 text-xs font-bold">{salesGrowth}</span>
                  </div>
                  <button className="mt-3 text-[10px] font-bold text-gray-500 hover:text-white transition flex items-center gap-1">
                    View chart <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="w-20 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitorData}>
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Visitor Online */}
            <Card
              title="Visitor Online"
              headerRight={<span className="text-[10px] font-bold text-gray-500 cursor-pointer hover:text-white">View</span>}
            >
              <div className="w-full h-[90px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitorData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 10 }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', stroke: '#161b22', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Market Share */}
            <Card
              title="Market Share"
              headerRight={<span className="text-[10px] font-bold text-gray-500 cursor-pointer hover:text-white">View</span>}
            >
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  {marketShare.map((m) => (
                    <span
                      key={m.name}
                      className="text-[10px] font-black px-2 py-0.5 rounded"
                      style={{ background: `${m.color}22`, color: m.color }}
                    >
                      {m.value}%
                    </span>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {marketShare.map((m) => (
                    <div
                      key={m.name}
                      className="h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${m.value}%`, background: m.color }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  {marketShare.map(m => <span key={m.name}>{m.name}</span>)}
                </div>
              </div>
            </Card>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-3 gap-6">

            {/* Revenue */}
            <Card
              title="Revenue"
              headerRight={<span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5 cursor-pointer">Weekly <ChevronRight className="w-3 h-3" /></span>}
            >
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false} tickCount={4} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 10 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={28}>
                      {revenueData.map((_, i) => {
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#0ea5e9', '#8b5cf6', '#06b6d4'];
                        return <Cell key={i} fill={colors[i % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Retention Rate */}
            <Card
              title="Retention Rate"
              headerRight={<span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5 cursor-pointer">Weekly <ChevronRight className="w-3 h-3" /></span>}
            >
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-44 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ v: retentionRate }, { v: 100 - retentionRate }]}
                        cx="50%" cy="100%"
                        startAngle={180} endAngle={0}
                        innerRadius={55} outerRadius={75}
                        dataKey="v" stroke="none"
                        cornerRadius={6}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#1c2333" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 inset-x-0 text-center">
                    <span className="text-3xl font-bold text-white">{retentionRate}</span>
                    <span className="text-sm text-gray-500 font-bold ml-0.5">%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Customers */}
            <Card
              title="Top Customers"
              headerRight={<span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5 cursor-pointer">Weekly <ChevronRight className="w-3 h-3" /></span>}
            >
              {/* Clean Donut Chart */}
              <div className="relative w-full h-32 mb-4 -mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rings}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={58}
                      paddingAngle={6}
                      dataKey="value" stroke="none"
                      cornerRadius={6}
                    >
                      {rings.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total</span>
                  <p className="text-xl font-black text-white leading-none">720k</p>
                </div>
              </div>

              {/* Customer list */}
              <div className="space-y-3">
                {topCustomers.slice(0, 3).map((c, i) => {
                  const colors = ['#10b981', '#3b82f6', '#f59e0b'];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: `${colors[i]}22`, color: colors[i] }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{c.name}</p>
                        <p className="text-[9px] text-gray-500">{c.type}</p>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-gray-700" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ROW 3 — Full-width Weekly Tasks */}
          <div className="bg-[#161b22] border border-white/5 rounded-[24px] p-6 flex gap-8
            hover:border-emerald-500/20 transition-all duration-300">

            {/* Left */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weekly tasks</span>
                <span className="text-[10px] text-gray-500">{weeklyTasks.completed}/{weeklyTasks.total} task completed</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${weeklyTasks.pct}%` }} />
                </div>
              </div>

              <div className="flex items-baseline gap-10 mb-5">
                <div>
                  <span className="text-4xl font-bold text-rose-400">{weeklyTasks.pct}</span>
                  <span className="text-lg text-rose-400 font-bold ml-0.5">%</span>
                  <p className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase tracking-widest">Task completed</p>
                </div>
                <div>
                  <span className="text-4xl font-bold text-rose-400">
                    {Math.max(0, weeklyTasks.pct - 38)}
                  </span>
                  <span className="text-lg text-rose-400 font-bold ml-0.5">%</span>
                  <p className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase tracking-widest">Better than last month</p>
                </div>
              </div>

              <div className="bg-[#0b0f15] rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5 max-w-sm">
                <span className="text-base">🎉</span>
                <p className="text-[11px] text-gray-300 font-medium italic">Your work balance this week awesome!</p>
              </div>
            </div>

            {/* Right — bar chart driven by dailyActivity from context */}
            <div className="w-[400px] flex-shrink-0">
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyActivity} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Bar dataKey="v" radius={[6, 6, 6, 6]} barSize={36}>
                      {dailyActivity.map((_, i) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#34d399', '#f59e0b', '#10b981', '#06b6d4'];
                        return <Cell key={i} fill={colors[i % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider px-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>

          <div className="h-20" />
        </div>

        {/* Floating AI Report button */}
        <button
          onClick={() => navigate('/report')}
          className="fixed bottom-8 right-8 z-50 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <FileBarChart className="w-4 h-4" />
          GENERATE AI REPORT
        </button>
      </div>
    </div>
  );
}
